class CheckoutUnavailableError(RuntimeError):
    def __init__(
        self,
        message: str = "Checkout temporarily unavailable",
        *,
        code: str = "CHECKOUT_UNAVAILABLE",
        retryable: bool = True,
    ):
        super().__init__(message)
        self.code = code
        self.retryable = retryable
