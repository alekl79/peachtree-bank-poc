using Microsoft.EntityFrameworkCore;

namespace peachtree_bank_poc;

public class TransactionStoreContext(DbContextOptions<TransactionStoreContext> dbContextOptions) : DbContext(dbContextOptions)
{
    public DbSet<TransferTransaction> Transactions { get; set; }
}
