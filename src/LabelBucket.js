import React, {useState, useEffect} from 'react';
import _ from 'lodash';
import uuid from 'uuid/v4';
import chroma from 'chroma-js';
import {updatedRecords} from './patch';
import {colors} from './colors';
import * as use from '@tensorflow-models/universal-sentence-encoder';
import BoxEmbedding from './BoxEmbedding';
import TinyEmbedding from './TinyEmbedding';
import * as tfvis from '@tensorflow/tfjs-vis'

export default function LabelBucket(props) {
  const {
    label,
    labelIndex,
    labels,
    setLabels,
    examplesMap,
    setExamplesMap,
    languageModel
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
          <Example
            key={example.id}
            example={example}
            color={chroma(colors[labelIndex]).alpha(0.5)}
            languageModel={languageModel}
            onChange={text => {
              setExamplesMap({
                ...examplesMap,
                [label.id]: updatedRecords(examples, example.id, {text})
              })
            }}
          />
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

function Example(props) {
  const {
    languageModel,
    example,
    color,
    onChange
  } = props;

  // embedding
  // const [isMapping, setIsMapping] = useState(false);
  // const [tokens, setTokens] = useState(null);
  // const [embedding, setEmbedding] = useState(null);
  // useEffect(() => {
  //   use.loadTokenizer()
  //     .then(tokenizer => tokenizer.encode(example.text))
  //     .then(setTokens)

  //   if (!languageModel) return;
  //   languageModel.embed(example.text)
  //     .then(e => e.array())
  //     .then(e => e[0])
  //     .then(setEmbedding)
  // }, [languageModel, example.text]);

  // visor
  // useEffect(() => {
  //   if (!languageModel) return;

  //   const surface = tfvis.visor().surface({ name: 'Model Summary', tab: 'Model' });
  //   tfvis.show.modelSummary(surface, languageModel);
  //   // // Render a barchart on that surface
  //   // tfvis.render.barchart(surface, embedding, {});
  // }, [languageModel, embedding]);


  return (
    <div
      className="App-example">
      <textarea
        className="App-example-textarea"
        placeholder="Example..."
        value={example.text}
        style={{backgroundColor: color}}
        onChange={e => onChange(e.target.value)}></textarea>
      {/*
      <div style={{fontSize: 12, color: '#666'}}>{tokens && tokens.join(' ')}</div>
      {embedding && (
        <div>
          <div style={{fontSize: 12, color: '#aaa'}}>{embedding.length}</div>
          <div>
            <BoxEmbedding embedding={embedding} style={{width: 100, height: 100}} />
          </div>
          <div>
            <TinyEmbedding embedding={embedding} style={{width: 200, height: 50}} />
          </div>
        </div>
      */}
      )}
    </div>
  );
}
