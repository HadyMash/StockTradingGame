import PropTypes from 'prop-types';

function TextInput({ type, prefix }) {
  TextInput.propTypes = {
    type: PropTypes.string.isRequired,
    prefix: PropTypes.string,
  };

  return (
    <div className="custom-input">
      {prefix && <p>{prefix}</p>}
      <input type={type} name="" id="" />
    </div>
  );
}

export default TextInput;
