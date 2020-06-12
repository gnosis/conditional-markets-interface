import React from "react";
import PropTypes from "prop-types";

import TextInput from "./TextInput";

const WalletInput = ({ className, input, meta, ...props }) => {
  return (
    <TextInput
      className={className}
      input={input}
      meta={meta}
      readOnly
      {...props}
    />
  );
};

WalletInput.propTypes = {
  input: PropTypes.shape({
    onChange: PropTypes.func
  }).isRequired,
  meta: PropTypes.shape({
    onChange: PropTypes.func
  }).isRequired,
  wrapComponent: PropTypes.oneOfType([PropTypes.string, PropTypes.func]),
  className: PropTypes.string
};

WalletInput.defaultProps = {
  className: null
};

export default WalletInput;
