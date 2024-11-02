class CreateUserResponseDTO implements IResponse {
  hasError: boolean;
  errors: string[];
  id?: number;

  constructor(hasError: boolean, errors: string[], id?: number) {
    this.hasError = hasError;
    this.errors = errors;
    this.id = id;
  }
}

export { CreateUserResponseDTO };
