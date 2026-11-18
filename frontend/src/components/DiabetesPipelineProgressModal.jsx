import React from 'react';
import ClinicalPipelineProgressModal from './ClinicalPipelineProgressModal';

export default function DiabetesPipelineProgressModal(props) {
  return (
    <ClinicalPipelineProgressModal
      diseaseTitle="Diabetes Mellitus"
      modality="tabular"
      {...props}
    />
  );
}
