using FluentValidation;

namespace Application.Validators {
    public static class ValidatorExtensions {
        public static IRuleBuilder<T, string> Password<T> (this IRuleBuilder<T, string> ruleBuilder) {
            var options = ruleBuilder
                .NotEmpty ()
                .MinimumLength (6).WithMessage ("Password must be atleast 6 characters")
                .Matches ("[A-Z]").WithMessage ("Password must contain at least 1 uppercase characters")
                .Matches ("[a-z]").WithMessage ("Password must contain at least 1 lowercase characters")
                .Matches ("[0-9]").WithMessage ("Password must contain at least 1 number characters")
                .Matches ("[^a-zA-Z0-9]").WithMessage ("Password must contain at least 1 non alphanumeric characters");
            return options;
        }
    }
}