import MedicationMemoryPanel from '../components/MedicationMemoryPanel';
import Medications from './Medications';

export default function MedicationEnhanced() {
  return <div className="space-y-6"><MedicationMemoryPanel /><Medications /></div>;
}
