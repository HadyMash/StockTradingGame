import PropTypes from 'prop-types';

function TextInput({
  type,
  name,
  id,
  min,
  max,
  prefix,
  suffix: Suffix,
  value,
  setValue,
}) {
  TextInput.propTypes = {
    type: PropTypes.string.isRequired,
    prefix: PropTypes.string,
    value: PropTypes.any,
    setValue: PropTypes.func,
    name: PropTypes.string,
    id: PropTypes.string,
    min: PropTypes.number,
    max: PropTypes.number,
    suffix: PropTypes.func,
  };

  return (
    <div className="custom-input">
      {prefix && <p>{prefix}</p>}
      <input
        type={type}
        name={name}
        id={id}
        value={value}
        min={min}
        max={max}
        onChange={(e) => setValue(e.target.value)}
      />
      {Suffix && <Suffix />}
    </div>
  );
}

export default TextInput;
