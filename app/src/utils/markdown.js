import React from "react";
import PropTypes from "prop-types";

const MarkdownLink = ({ href, children }) => (
  <a href={href} target="_blank" rel="noopener noreferrer">
    {children}
  </a>
);

MarkdownLink.propTypes = {
  href: PropTypes.string.isRequired,
  children: PropTypes.node
};

MarkdownLink.defaultProps = {
  children: null
};

export const markdownRenderers = {
  link: MarkdownLink
};
/* eslint-enable */
