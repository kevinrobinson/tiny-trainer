import React, { useState, useEffect } from 'react';
import _ from 'lodash';
import uuid from 'uuid/v4';
import chroma from 'chroma-js';
import './App.css';
import {loadModel, embeddingsFor} from './encoder';
import {teach} from './classify';


const demoLabels = [
  {id: 'a', text: 'smart phones' },
  {id: 'b', text: 'food and health' },
  {id: 'c', text: 'asking about age' },
];
const demoExamplesMap = {
  'a': [
    { id: 'a1', text: "I like my phone" },
    { id: 'a2', text: "My phone is not good." },
    { id: 'a3', text: "Your cellphone looks great." },
  ],
  'b': [
    { id: 'b1', text: "An apple a day, keeps the doctors away" },
    { id: 'b2', text: "Eating strawberries is healthy" },
    { id: 'b3', text: "Is paleo better than keto?" }
  ],
  'c': [
    { id: 'c1', text: "How old are you?" },
    { id: 'c2', text: "What is your age?" }
  ]
};
const demoTestSentences = [
  'Kale and brussels are the best foods.',
  'Blackberry is better than Android.',
  'You are too young to make things with computers!'
];

// const demoResults = [ { "predictions": { "classIndex": 1, "confidences": { "0": 0, "1": 1 } }, "sentence": "Which one is it?" }, { "predictions": { "classIndex": 1, "confidences": { "0": 0.3333333333333333, "1": 0.6666666666666666 } }, "sentence": "You think you can tell." }, { "predictions": { "classIndex": 1, "confidences": { "0": 0.3333333333333333, "1": 0.6666666666666666 } }, "sentence": "But can you?" } ];
// const demoResults = [{"predictions":{"classIndex":1,"confidences":{"0":0,"1":1,"2":0}},"sentence":"Kale and brussels are the best foods."},{"predictions":{"classIndex":0,"confidences":{"0":1,"1":0,"2":0}},"sentence":"Blackberry is better than Android."},{"predictions":{"classIndex":2,"confidences":{"0":0.3333333333333333,"1":0,"2":0.6666666666666666}},"sentence":"You are too young to make things with computers!"}];

export default function App() {
  const [labels, setLabels] = useState(demoLabels);
  const [examplesMap, setExamplesMap] = useState(demoExamplesMap);
  const [trainingData, setTrainingData] = useState(null);
  const languageModel = usePromise(loadModel);
  const [results, setResults] = useState(null);
  const [testSentences, setTestSentences] = useState(demoTestSentences);

  // do training and prediction
  useEffect(() => {
    if (languageModel === null) return;
    if (trainingData === null) return;
    if (results !== null) return;
    teachableExamplesFor(languageModel, trainingData).then(teachableExamples => {
      console.log('teachableExamples', teachableExamples);
      const classifier = teach(teachableExamples);
      console.log('classifier', classifier);
      Promise.all(testSentences.map(testSentence => {
        return embeddingsFor(languageModel, [testSentence]).then(embeddings => {
          return classifier.predictClass(embeddings).then(predictions => {
            console.log('predictions', predictions, testSentence);
            return {embeddings, predictions, sentence: testSentence};
          });
        });
      })).then(setResults);
    });
  }, [languageModel, trainingData, results]);

  return (
    <div className="App">
      <header className="App-header">
        <div className="App-bar">
          <button
            className="App-button"
            style={{color: '#eee'}}
            onClick={() => setLabels(labels.concat(newLabel()))}>
            Add label
          </button>
        </div>
        <div className="App-buckets">
          {labels.map((label, labelIndex) => (
            <LabelBucket
              key={label.id}
              label={label}
              labelIndex={labelIndex}
              labels={labels}
              setLabels={setLabels}
              examplesMap={examplesMap}
              setExamplesMap={setExamplesMap}
            />
          ))}
        </div>
        <div className="App-training">
          <button
            className="App-button App-button-train"
            disabled={!languageModel}
            onClick={() => setTrainingData({labels, examplesMap})}>
            {(!trainingData || results) ? 'Train' : 'Training...'}
          </button>
        </div>
        <div className="App-results">
          {!trainingData && testSentences.map((sentence, sentenceIndex) => (
            <div className="App-sentence" key={sentenceIndex}>
              <input
                type="text"
                className="App-test-sentence-input"
                onChange={e => setTestSentences(updatedList(testSentences, sentence, e.target.value))}
                value={sentence}
              />
            </div>
          ))}
          {(results || []).map(result => (
            <div className="App-result" key={result.sentence}>
              <div>{result.sentence}</div>
              <div style={{
                position: 'absolute',
                left: 0,
                right: 0,
                bottom: 0,
                top: 0,
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'flex-end'
              }}>
                {Object.keys(result.predictions.confidences).map(classIndex => (
                  <div key={classIndex} style={{
                    flex: 1,
                    background: colors[classIndex],
                    opacity: 0.5,
                    height: Math.floor(result.predictions.confidences[classIndex]*100) + '%'}}></div>
                ))}
              </div>
              <div style={{color: 'red'}}>
                <TinyEmbedding embedding={result.embeddings} />
              </div>
            </div>
          ))}
          {/*<pre style={{fontSize: 10}}>{JSON.stringify(results)}</pre>*/}
        </div>
      </header>
    </div>
  );
}

function newLabel() {
  return {
    id: uuid(),
    text: ''
  };
}

function newExample() {
  return {
    id: uuid(),
    text: ''
  }; 
}

function updatedList(items, oldItem, newItem) {
  const index = items.indexOf(oldItem);
  const updated = items.slice(0);
  updated.splice(index, 1, newItem);
  return updated;
}

function updatedRecords(labels, id, attrs) {
  return labels.map(label => {
    return (label.id === id)
      ? {...label, ...attrs}
      : label;
  });
}

function usePromise(promiseFn) {
  const [value, setValue] = useState(null);
  useEffect(() => {
    if (value !== null) return;
    promiseFn().then(setValue);
  }, [value]);

  return value;
}

function teachableExamplesFor(languageModel, trainingData) {
  const {labels, examplesMap} = trainingData;
  return Promise.all(_.flatMap(labels, (label, labelIndex) => {
    const examples = examplesMap[label.id];
    return examples.map(example => {
      return embeddingsFor(languageModel, [example.text]).then(embeddings => {
        return {embeddings, labelIndex};
      });
    });
  }));
}

function LabelBucket(props) {
  const {label, labelIndex, labels, setLabels, examplesMap, setExamplesMap} = props;
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
              style={{
                backgroundColor: chroma(colors[labelIndex]).alpha(0.5)
              }}
              onChange={e => {
                setExamplesMap({
                  ...examplesMap,
                  [label.id]: updatedRecords(examples, example.id, {
                    text: e.target.value
                  })
                })
              }}></textarea>
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

function TinyEmbedding({embedding}) {
  const numbers = embedding.dataSync();
  console.log('numbers', numbers);
  return (
    <div style={{
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      top: 0,
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'flex-end'
    }}>
      {numbers.map((number, index) => {
        const height = `${Math.floor((0.5+number)*100)}%`;
        console.log(number, number + 0.5, index, height, Math.floor(number*100));
        return (
          <div key={index} style={{
            flex: 1,
            background: 'black',
            opacity: 0.8,
            width: `${Math.floor(100 * 1/numbers.length)}%`,
            height
          }}>ok</div>
        );
      })}
    </div>
  );
}
const colors = [
  '#31AB39',
  '#EB4B26',
  '#139DEA',
  // '#333333',
  '#CDD71A',
  '#6A2987',
  '#fdbf6f',
  '#ff7f00',
  '#cab2d6',
  '#6a3d9a',
  '#ffff99',
  '#b15928'
];