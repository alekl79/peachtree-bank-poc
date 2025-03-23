using FluentValidation;
using FluentValidation.AspNetCore;
using MicroElements.Swashbuckle.FluentValidation.AspNetCore;
using Microsoft.EntityFrameworkCore;
using peachtree_bank_poc;
using System.Linq.Dynamic.Core;
using System.Text.Json.Serialization;

var builder = WebApplication.CreateBuilder(args);

// Wolverine usage is required for WolverineFx.Http
var connectionString = builder.Configuration["Peachtree:ConnectionString"];

builder.Services.AddDbContext<TransactionStoreContext>(options =>
{
    options.UseSqlite("Data Source=transactions.db");
});

// Register FluentValidation
builder.Services.AddFluentValidationAutoValidation();
builder.Services.AddValidatorsFromAssemblyContaining<TransferTransactionValidator>();

// Add services to the DI container.
builder.Services.AddOpenApi();
builder.Services.ConfigureHttpJsonOptions(cfg => cfg.SerializerOptions.Converters.Add(new JsonStringEnumConverter()));

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SupportNonNullableReferenceTypes();
});
builder.Services.AddFluentValidationRulesToSwagger();

var app = builder.Build();

// Ensure the database is created at startup
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<TransactionStoreContext>();
    await db.Database.EnsureCreatedAsync();
}

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
    app.MapOpenApi();
}

app.UseHttpsRedirection();

// GET a transaction details by Id
app.MapGet("api/transactions/{id}", async (Guid id, TransactionStoreContext db) =>
    await db.Transactions.FindAsync(id) is TransferTransaction transaction
        ? Results.Ok(transaction)
        : Results.NotFound());

// Filter and page transactions
app.MapGet("api/transactions/{page:int}/{pageSize:int}", async (string? q, string? sortBy, string? sortDirection, int page, int pageSize, TransactionStoreContext db) =>
{
    var queryable = db.Transactions.AsQueryable();
    if (!string.IsNullOrEmpty(q))
    {
        var lowerQ = q.ToLower();
        
        queryable = queryable.Where(t =>
            EF.Functions.Like(t.FromAccount.ToLower(), $"%{lowerQ}%") ||
            EF.Functions.Like(t.ToAccount.ToLower(), $"%{lowerQ}%"));
    }
    if (!string.IsNullOrEmpty(sortBy))
    {
        var order = string.Equals(sortDirection, "desc", StringComparison.OrdinalIgnoreCase) ? "desc" : "asc";
        queryable = queryable.OrderBy($"{sortBy} {order}");
    }
    else
    {
        queryable = queryable.OrderByDescending(t => t.Created);
    }
    var results = await queryable.Skip((page - 1)*pageSize).Take(pageSize).ToListAsync();
    if (results.Count == 0)
    {
        return Results.NoContent();
    }
    else
    {
        return Results.Ok(results);
    }
});
 
// POST: create a new transaction
app.MapPost("api/transactions", async (TransferTransaction transaction, TransactionStoreContext db, IValidator<TransferTransaction> validator) =>
{
    // Validate the transaction
    var validationResult = await validator.ValidateAsync(transaction);
    if (!validationResult.IsValid)
    {
        return Results.BadRequest(validationResult.Errors);
    }

    transaction.Id = Guid.CreateVersion7();
    transaction.Created = DateTimeOffset.UtcNow;

    db.Transactions.Add(transaction);
    await db.SaveChangesAsync();
    return Results.Created($"/transactions/{transaction.Id}", transaction);
});

// POST: bulk create a new transactions
app.MapPost("api/transactions/bulk", async (ICollection<TransferTransaction> transactions, TransactionStoreContext db, IValidator<TransferTransaction> validator) =>
{
    // Validate the transaction
    List<FluentValidation.Results.ValidationResult> validationResults = new List<FluentValidation.Results.ValidationResult>();
    foreach (var transaction in transactions)
    {
        validationResults.Add(await validator.ValidateAsync(transaction));
    }
    
    if (validationResults.Any(v => !v.IsValid))
    {
        return Results.BadRequest(validationResults.SelectMany(v => v.Errors));
    }

    var transactionsCreated = new List<TransferTransaction>();
    foreach (var transaction in transactions)
    {
        transaction.Id = Guid.CreateVersion7();
        transaction.Created = DateTimeOffset.UtcNow;
        db.Transactions.Add(transaction);
        transactionsCreated.Add(transaction);
    }
    await db.SaveChangesAsync();
    return Results.Created($"{string.Join(',', transactionsCreated.Select(t => $"api/transactions/{t.Id}"))}", transactionsCreated);
});

// PUT: update the state of an existing transaction
app.MapPut("api/transactions/{id}/state/{state}", async (Guid id, TransactionState state, TransactionStoreContext db) =>
{
    var transaction = await db.Transactions.FindAsync(id);
    if (transaction is null) return Results.NotFound();

    transaction.State = state;
    // update LastStateUpdate on changes
    transaction.LastStateUpdate = DateTimeOffset.UtcNow;
    transaction.Version++;

    await db.SaveChangesAsync();
    return Results.NoContent();
});

await app.RunAsync();