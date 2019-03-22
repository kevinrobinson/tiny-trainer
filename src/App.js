import React, { useState, useEffect } from 'react';
import _ from 'lodash';
import uuid from 'uuid/v4';
import chroma from 'chroma-js';
import './App.css';
import * as tf from '@tensorflow/tfjs';
import {loadModel, embeddingsFor} from './encoder';
import {teach} from './classify';
import IngredientsLabel from './IngredientsLabel';


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
  const [classifier, setClassifier] = useState(null);
  const [results, setResults] = useState(null);
  const [testSentences, setTestSentences] = useState(demoTestSentences);

  // do training
  const [isTraining, setIsTraining] = useState(false);
  const shouldTrainClassifier = (
    (languageModel !== null) &&
    (trainingData !== null) &&
    (classifier === null) &&
    (!isTraining)
  );
  useEffect(() => {
    if (!shouldTrainClassifier) return;

    setIsTraining(true);
    teachableExamplesFor(languageModel, trainingData)
      .then(teachableExamples => teach(teachableExamples))
      .then(setClassifier)
      // .then(() => console.log('dataset', classifier.getClassifierDataset()))
      .then(() => setIsTraining(false));
  }, [isTraining, trainingData, languageModel, classifier]);

  // do prediction
  const [isPredicting, setIsPredicting] = useState(false);
  const shouldPredict = (
    (!isTraining) &&
    (classifier !== null) &&
    (results === null) &&
    (!isPredicting)
  );
  useEffect(() => {
    if (!shouldPredict) return;

    setIsPredicting(true);
    embeddingsFor(languageModel, testSentences).then(embeddingsT => {
      // console.log('embeddingsT', embeddingsT);
      return embeddingsT.array().then(embeddings => {
        // console.log('embeddings', embeddings);
        return Promise.all(embeddings.map((embedding, index) => {
          // console.log('embedding, index', index, embedding);
          return classifier.predictClass(tf.tensor(embedding)).then(predictions => {
            const sentence = testSentences[index];
            // console.log('predictions', sentence, predictions);
            return {embedding, predictions, sentence};
          });
        }));
      });
    }).then(setResults).then(() => setIsPredicting(false));
  }, [isTraining, isPredicting, testSentences, classifier, results]);

  // Some bug here with UI not updating, even though
  // this is as expected.  React scheduler or browser GPU?
  // It happens in Safari but noot Chrome, so maybe browser side?
  const buttonText = isTraining
    ? 'Training...'
    : isPredicting
      ? 'Predicting...'
      : 'Train';
  console.log('render', buttonText, {isTraining, isPredicting});
  return (
    <div className="App">
      <header className="App-header">
        <div className="App-bar">
          <span style={{marginRight: 10}}>Training data</span>
          <button
            className="App-button"
            style={{color: '#eee', display: 'inline-block'}}
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
            disabled={!languageModel || isTraining || isPredicting}
            onClick={() => setTrainingData({labels, examplesMap})}>
            {buttonText}
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
            <div key={result.sentence}>
              <div className="App-result">
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
              </div>
              <TinyEmbedding embedding={result.embedding} />
            </div>
          ))}
          {/*<pre style={{fontSize: 10}}>{JSON.stringify(results)}</pre>*/}
          <div className="App-ingredients"><ProjectIngredients /></div>
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
  const width = 1;
  return (
    <svg
      className="App-embedding-svg"
      width="100%"
      height={30}
      preserveAspectRatio="none"
      viewBox={`0 0 ${embedding.length} 100`}
    >
      {embedding.map((number, index) => {
        // TODO(kr) just guess about why these are negative, need
        // to learn more, this just assumes they're [-0.5, 0.5]
        const height = Math.round((0.5+number)*100);
        return (
          <rect
            className="App-embedding-rect"
            key={index}
            x={width * index}
            y={100 - height}
            width={width}
            height={height}
          />
        );
      })}
    </svg>
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


function ProjectIngredients() {
  return (
    <IngredientsLabel
      dataSets={<div><a target="_blank" rel="noopener noreferrer"  href="https://arxiv.org/abs/1803.11175">Web sources (eg, Wikipedia, news and Q&A sites)</a> by Google</div>}
      preTrainedModels={<div><a target="_blank" rel="noopener noreferrer" href="https://github.com/tensorflow/tfjs-models/tree/master/universal-sentence-encoder">Universal Sentence Encoder lite</a> by Google</div>}
      architectures={<div>
        <div><a target="_blank" rel="noopener noreferrer" href="https://arxiv.org/pdf/1706.03762.pdf">Transformer</a> by Google</div>
        <div><a target="_blank" rel="noopener noreferrer" href="https://github.com/tensorflow/tfjs-models/tree/master/knn-classifier">KNN Classifier</a> by Google</div>
      </div>}
      tunings={<div><a target="_blank" rel="noopener noreferrer" href="https://github.com/kevinrobinson/tiny-trainer">tiny-trainer</a> by <a target="_blank" rel="noopener noreferrer" href="https://github.com/kevinrobinson">Kevin Robinson</a></div>}
    />
  );
}