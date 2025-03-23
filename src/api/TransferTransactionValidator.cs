using FluentValidation;
using peachtree_bank_poc;

public class TransferTransactionValidator : AbstractValidator<TransferTransaction>
{
    public const int MaxNameLength = 255;
    public TransferTransactionValidator()
    {
        RuleFor(x => x.FromAccount)
            .MinimumLength(2) // Chinese names can be 2 characters long
            .MaximumLength(MaxNameLength)
            .NotEmpty().WithMessage("FromAccount is required.");

        RuleFor(x => x.ToAccount)
            .MinimumLength(2) // Chinese names can be 2 characters long
            .MaximumLength(MaxNameLength)
            .NotEmpty().WithMessage("ToAccount is required.");

        RuleFor(x => x.State)
            .IsInEnum();
    }
}
