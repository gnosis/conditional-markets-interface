export const isRequired = value => {
  if (value == null) return "This field is required.";

  return undefined;
};

const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&’*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;
export const isEmail = value => {
  if (!EMAIL_REGEX.test(value)) {
    return "The entered E-Mail is invalid";
  }

  return undefined;
};

export const validator = fields => values => {
  const errors = {};

  Object.keys(fields).forEach(fieldName => {
    let validators = fields[fieldName];

    if (typeof validators === "function") {
      validators = [validators];
    }

    const value = values[fieldName];
    let error;
    validators.some(validatorFunc => {
      error = validatorFunc(value);

      if (error != null) {
        return true;
      }
      return false;
    });

    if (error) {
      errors[fieldName] = error;
    }
  });

  return errors;
};

export const fieldValidator = validationsOrValidatorFunc => value => {
  let validations = validationsOrValidatorFunc;
  if (typeof validationsOrVaalidatorFunc === "function") {
    validations = [validationsOrValidatorFunc];
  }

  let error;
  validations.some(validatorFunc => {
    error = validatorFunc(value);

    if (error != null) {
      return true;
    }
    return false;
  });

  return error;
};
