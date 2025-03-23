namespace peachtree_bank_poc;

/// <summary>
/// Represents the transaction state.
/// </summary>
public enum TransactionState
{
    /// <summary>
    /// The transaction is being sent.
    /// </summary>
    Send = 0,
    /// <summary>
    /// The transaction is received.
    /// </summary>
    Received = 1,
    /// <summary>
    /// The transaction is paid.
    /// </summary>
    Paid = 2
}
