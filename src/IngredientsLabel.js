import React from 'react';
import './IngredientsLabel.css';


export default function IngredientsLabel({dataSets, architectures, preTrainedModels, tunings, style = {}}) {
  return (
    <div className="IngredientsLabel" style={style}>
      <div className="IngredientsLabel-heading">
        <span className="IngredientsLabel-name">AI Ingredients Label</span>
        <a target="_blank" rel="noopener noreferrer" href="http://datanutrition.media.mit.edu/">Inspiration</a>
      </div>
      <div className="IngredientsLabel-section">
        <div className="IngredientsLabel-title">Data sets</div>
        <div className="IngredientsLabel-text">{dataSets}</div>
      </div>
      <div className="IngredientsLabel-section">
        <div className="IngredientsLabel-title">Pre-trained models</div>
        <div className="IngredientsLabel-text">{preTrainedModels}</div>
      </div>
      <div className="IngredientsLabel-section">
        <div className="IngredientsLabel-title">Architectures</div>
        <div className="IngredientsLabel-text">{architectures}</div>
      </div>
      <div className="IngredientsLabel-section">
        <div className="IngredientsLabel-title">Tunings</div>
        <div className="IngredientsLabel-text">{tunings}</div>
      </div>
    </div> 
  );
}
