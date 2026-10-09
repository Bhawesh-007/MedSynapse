import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import DashboardHome from './components/DashboardHome';
import OCRScannerView from './components/OCRScannerView';
import DiabetesView from './components/DiabetesView';
import HeartView from './components/HeartView';
import XRayView from './components/XRayView';
import BrainTumorView from './components/BrainTumorView';
import BreastCancerView from './components/BreastCancerView';
import LiverDiseaseView from './components/LiverDiseaseView';
import KidneyStoneView from './components/KidneyStoneView';
import SkinCancerView from './components/SkinCancerView';
import EyeDiseaseView from './components/EyeDiseaseView';
import { checkHealth } from './services/api';
import { Activity } from 'lucide-react';

export default function App() {
  const [currentTab, setCurrentTab] = useState('home');
  const [systemStatus, setSystemStatus] = useState(null);
  const [appliedDiabetesData, setAppliedDiabetesData] = useState(null);
  const [appliedHeartData, setAppliedHeartData] = useState(null);
  const [appliedBreastData, setAppliedBreastData] = useState(null);
  const [appliedLiverData, setAppliedLiverData] = useState(null);
  const [extractedHighlights, setExtractedHighlights] = useState(null);

  const fetchHealth = async () => {
    const status = await checkHealth();
    setSystemStatus(status);
  };

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleApplyOCRParams = (targetDisease, params, rawExtracted) => {
    if (targetDisease === 'diabetes') {
      setAppliedDiabetesData(params);
    } else if (targetDisease === 'heart') {
      setAppliedHeartData(params);
    } else if (targetDisease === 'breast') {
      setAppliedBreastData(params);
    } else if (targetDisease === 'liver') {
      setAppliedLiverData(params);
    }
    setExtractedHighlights(rawExtracted);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#fcfdfd' }}>
      {/* Top Navbar with all 9 modules */}
      <Navbar 
        currentTab={currentTab} 
        setTab={setCurrentTab} 
        systemStatus={systemStatus} 
        onRefreshStatus={fetchHealth} 
      />

      {/* Main Content Viewport */}
      <main style={{ flex: 1, maxWidth: '1240px', width: '100%', margin: '0 auto', padding: '1.75rem 1.25rem' }}>
        {currentTab === 'home' && (
          <DashboardHome setTab={setCurrentTab} />
        )}

        {currentTab === 'ocr' && (
          <OCRScannerView onApplyParams={handleApplyOCRParams} setTab={setCurrentTab} />
        )}

        {/* M1: Diabetes Mellitus */}
        {currentTab === 'diabetes' && (
          <DiabetesView 
            initialData={appliedDiabetesData} 
            extractedHighlights={extractedHighlights} 
            setTab={setCurrentTab} 
          />
        )}

        {/* M2: Coronary Heart Disease */}
        {currentTab === 'heart' && (
          <HeartView 
            initialData={appliedHeartData} 
            setTab={setCurrentTab} 
          />
        )}

        {/* M3: Pneumonia (Chest X-Ray) */}
        {currentTab === 'xray' && (
          <XRayView />
        )}

        {/* M4: Cranial Brain Tumor (MRI) */}
        {currentTab === 'brain-tumor' && (
          <BrainTumorView setTab={setCurrentTab} />
        )}

        {/* M5: Breast Cancer (WDBC FNA) */}
        {currentTab === 'breast' && (
          <BreastCancerView setTab={setCurrentTab} initialData={appliedBreastData} />
        )}

        {/* M6: Liver Disease (ILPD LFT) */}
        {currentTab === 'liver' && (
          <LiverDiseaseView setTab={setCurrentTab} initialData={appliedLiverData} />
        )}

        {/* M7: Kidney Pathology & Stones (CT) */}
        {currentTab === 'kidney-stone' && (
          <KidneyStoneView setTab={setCurrentTab} />
        )}

        {/* M8: Skin Cancer (HAM10000 Dermoscopy) */}
        {currentTab === 'skin-cancer' && (
          <SkinCancerView setTab={setCurrentTab} />
        )}

        {/* M9: Eye Diseases (Retinal Fundus) */}
        {currentTab === 'eye' && (
          <EyeDiseaseView setTab={setCurrentTab} />
        )}
      </main>

      {/* Footer */}
      <footer style={{
        marginTop: 'auto',
        borderTop: '1px solid #cbd5e1',
        backgroundColor: '#ffffff',
        padding: '1.5rem 1.25rem',
        color: '#64748b',
        fontSize: '0.82rem'
      }}>
        <div style={{
          maxWidth: '1240px',
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Activity size={16} color="#0f172a" />
            <span style={{ fontWeight: 700, color: '#0f172a' }}>MedSynapse Clinical AI Diagnostic Platform</span>
            <span>• 9 Unified Diagnostic Modules</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span>Tesseract OCR • PyTorch • Keras 3 • Scikit-Learn</span>
            <span className="badge badge-cyan" style={{ fontSize: '0.68rem' }}>ISO/IEEE CDSS Standard</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
