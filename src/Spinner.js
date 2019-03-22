import React from 'react';
import spinner from './spinner.svg';
import './Spinner.css';

export default function Spinner(props) {
  return (
    <img
      className="Spinner"
      src={spinner}
      alt="waiting..."
      {...props}
    />
  );
}