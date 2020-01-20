export default class ToastifyError extends Error {
  constructor(message) {
    super(message);
    this.name = "ToastifyError";
  }
}
