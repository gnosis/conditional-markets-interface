import * as types from "../actions/example-types";

const INITIAL_STATE = {
  exampleField: null
};

export default function example(state = INITIAL_STATE, action) {
  switch (action.type) {
    case types.SET_EXAMPLE_FIELD:
      return {
        ...state,
        exampleField: action.exampleField
      };
    default:
      return state;
  }
}
