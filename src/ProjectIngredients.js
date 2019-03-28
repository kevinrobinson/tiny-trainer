import React from 'react';
import IngredientsLabel from './IngredientsLabel';

export default function ProjectIngredients() {
  return (
    <IngredientsLabel
      dataSets={<div><a target="_blank" rel="noopener noreferrer" href="https://arxiv.org/abs/1803.11175">Web sources (eg, Wikipedia, news and Q&A sites)</a> by Google</div>}
      preTrainedModels={<div><a target="_blank" rel="noopener noreferrer" href="https://github.com/tensorflow/tfjs-models/tree/master/universal-sentence-encoder">Universal Sentence Encoder lite</a> by Google</div>}
      architectures={<div>
        <div><a target="_blank" rel="noopener noreferrer" href="https://arxiv.org/pdf/1706.03762.pdf">Transformer</a> by Google</div>
        <div><a target="_blank" rel="noopener noreferrer" href="https://github.com/tensorflow/tfjs-models/tree/master/knn-classifier">KNN Classifier</a> by Google</div>
      </div>}
      tunings={<div><a target="_blank" rel="noopener noreferrer" href="https://github.com/kevinrobinson/tiny-trainer">tiny-trainer</a> by <a target="_blank" rel="noopener noreferrer" href="https://github.com/kevinrobinson">Kevin Robinson</a></div>}
    />
  );
}