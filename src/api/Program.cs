using FluentValidation;
using FluentValidation.AspNetCore;
using MicroElements.Swashbuckle.FluentValidation.AspNetCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using peachtree_bank_poc;
using System.Linq.Dynamic.Core;
using System.Text.Json.Serialization;

var builder = WebApplication.CreateBuilder(args);

var connectionString = builder.Configuration["Peachtree:ConnectionString"];
var corsDomain = builder.Configuration["CorsUi"] ?? "http://localhost:3000";
builder.Services.AddDbContext<TransactionStoreContext>(options =>
{
    // Use environment variable to determine if running in Docker
    var dbPath = Environment.GetEnvironmentVariable("DOCKER_RUNNING") == "true" 
        ? "data/transactions.db"
        : "transactions.db";
        
    options.UseSqlite($"Data Source={dbPath}");
});

// Register FluentValidation
builder.Services.AddFluentValidationAutoValidation();
builder.Services.AddValidatorsFromAssemblyContaining<TransferTransactionValidator>();

// Add services to the DI container.
builder.Services.AddOpenApi();
builder.Services.ConfigureHttpJsonOptions(cfg => cfg.SerializerOptions.Converters.Add(new JsonStringEnumConverter()));
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowPeachtreeApp", builder =>
    {
        builder.WithOrigins(corsDomain)
               .AllowAnyMethod()
               .AllowAnyHeader();
    });
});
builder.Services.AddHealthChecks();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SupportNonNullableReferenceTypes();

    // Add JWT Authentication to Swagger
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Description = "JWT Authorization header using the Bearer scheme. Example: \"Bearer {token}\"",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });

    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });

    // Add API information
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "Peachtree Bank API",
        Version = "v1",
        Description = "API for Peachtree Bank transaction management"
    });
});
builder.Services.AddFluentValidationRulesToSwagger();

// Firebase JWT Bearer Authentication
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.Authority = "https://securetoken.google.com/peachtree-bank-b3edd";
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = "https://securetoken.google.com/peachtree-bank-b3edd",
            ValidateAudience = true,
            ValidAudience = "peachtree-bank-b3edd",
            ValidateLifetime = true
        };
    });

builder.Services.AddAuthorization();

var app = builder.Build();
app.UseCors("AllowPeachtreeApp");

app.Logger.LogInformation("Configured CORS for: {Url}", corsDomain);
// Ensure the database is created at startup
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<TransactionStoreContext>();
    await db.Database.EnsureCreatedAsync();
}
app.Logger.LogInformation("Database configured");
// Normally, we would only enable Swagger in Development/Test envs. But for this Poc, it is okay.
//if (app.Environment.IsDevelopment())
//{
app.UseSwagger();
    app.UseSwaggerUI();
    app.MapOpenApi();
//}

if (builder.Configuration.GetValue<bool>("UseHttpsRedirection", false))
{
    app.UseHttpsRedirection();
}

app.UseAuthentication();
app.UseAuthorization();
app.MapHealthChecks("/hc");

app.Logger.LogInformation("Health check endpoint enabled");
// GET a transaction details by Id
app.MapGet("api/transactions/{id}", async (Guid id, TransactionStoreContext db) =>
    await db.Transactions.FindAsync(id) is TransferTransaction transaction
        ? Results.Ok(transaction)
        : Results.NotFound())
    .RequireAuthorization();

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
        if (sortBy.Equals(nameof(TransferTransaction.Amount), StringComparison.OrdinalIgnoreCase))
        {
            queryable = order == "desc"
                ? queryable.OrderByDescending(t => t.Amount)
                : queryable.OrderBy(t => t.Amount);
        }
        else
        {
            queryable = queryable.OrderBy($"{sortBy} {order}");
        }
    }
    else
    {
        queryable = queryable.OrderByDescending(t => t.Created);
    }
    var totalCount = await queryable.CountAsync();
    var totalPages = (int)Math.Ceiling(totalCount / (double)pageSize);
    var results = await queryable.Skip((page - 1)*pageSize).Take(pageSize).ToListAsync();
    var response = new
    {
        data = results,
        currentPage = page,
        totalPages,
        pageSize,
        activeFilters = new
        {
            q,
            sortBy,
            sortDirection
        }
    };

    return totalCount == 0 ? Results.NoContent() : Results.Ok(response);
}).RequireAuthorization();
 
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
}).RequireAuthorization();

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
}).RequireAuthorization();
app.Logger.LogInformation("Endpoints configured. Api Started.");
await app.RunAsync();