const Validation = (schema, data) => {
  const result = schema.safeParse(data);
  if (result.success) {
    return { isValid: true, data: result.data };
  }

  return {
    isValid: false,
    error: {
      message: "Validation error",
      errors: result.error.flatten(),
    },
  };
};

module.exports = Validation;
