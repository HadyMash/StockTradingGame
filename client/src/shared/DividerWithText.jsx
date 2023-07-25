import PropTypes from 'prop-types';

function DividerWithText({ children }) {
  DividerWithText.propTypes = {
    children: PropTypes.node.isRequired,
  };
  return (
    <div className="divider-with-text">
      <div className="divider"></div>
      <div className="content">{children}</div>
      <div className="divider"></div>
    </div>
  );
}

export default DividerWithText;
