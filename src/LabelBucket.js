import React from 'react';
import _ from 'lodash';
import uuid from 'uuid/v4';
import chroma from 'chroma-js';
import {updatedRecords} from './patch';
import {colors} from './colors';

export default function LabelBucket(props) {
  const {
    label,
    labelIndex,
    labels,
    setLabels,
    examplesMap,
    setExamplesMap
  } = props;
  const examples = examplesMap[label.id] || [];

  return (
    <div
      key={label.id}
      className="App-bucket">
      <div className="App-bucket-header" style={{backgroundColor: colors[labelIndex]}}>
        <input
          type="text"
          className="App-bucket-input"
          style={{backgroundColor: colors[labelIndex]}}
          placeholder="Label..."
          value={label.text}
          onChange={e => {
            setLabels(updatedRecords(labels, label.id, {
              text: e.target.value
            }));
          }} />
        <button
          className="App-button"
          onClick={() => setLabels(_.without(labels, label))}>
          ×
        </button>
      </div>
      <div className="App-examples">
        {examples.map(example => (
          <div
            key={example.id}
            className="App-example">
            <textarea
              className="App-example-textarea"
              placeholder="Example..."
              value={example.text}
              style={{backgroundColor: chroma(colors[labelIndex]).alpha(0.5)}}
              onChange={e => {
                setExamplesMap({
                  ...examplesMap,
                  [label.id]: updatedRecords(examples, example.id, {text: e.target.value})
                })
              }}
            />
          </div>
        ))}
      </div>
      <button
        className="App-button"
        style={{marginTop: 10, marginBottom: 20, color: 'black'}}
        onClick={() => {
          setExamplesMap({
            ...examplesMap,
            [label.id]: examples.concat(newExample())
          });
        }}>
        Add example
      </button>
    </div>
  );
}


function newExample() {
  return {
    id: uuid(),
    text: ''
  }; 
}
