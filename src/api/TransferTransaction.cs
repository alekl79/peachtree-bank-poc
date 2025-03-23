namespace peachtree_bank_poc;
public record CreateTransferTransaction(string FromAccount, string ToAccount, decimal Amount);
public record TransactionCreated(string FromAccount, string ToAccount, decimal Amount);
public record StateUpdated(Guid Id, TransactionState State);
public record QueryTransactions(string? SearchText, int Page, int PageSize, string SortBy, string SortDirection);

public class TransferTransaction
{
    public Guid Id { get; internal set; }
    /// <summary>
    /// From Account
    /// </summary>
    public required string FromAccount { get; set; }
    /// <summary>
    /// To Account
    /// </summary>
    public required string ToAccount { get; set; }
    /// <summary>
    /// Enter $ Amount. Negative amount is allowed.
    /// </summary>
    public double Amount { get; set; } // Sqlite does not support decimal ordering... and double is half the size of decimal
    public DateTimeOffset Created { get; internal set; }
    /// <summary>
    /// The State of the Transaction
    /// </summary>
    public TransactionState State { get; set; }
    /// <summary>
    /// Last State update if any.
    /// </summary>
    public DateTimeOffset? LastStateUpdate { get; set; }
    /// <summary>
    /// For internal use.
    /// </summary>
    public int Version { get; set; }
}