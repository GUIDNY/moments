import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import StudioApp from './StudioApp.jsx';
import TourApp from './TourApp.jsx';
import { specFromLocation } from './share';
import '../index.css';

/**
 * One page, two jobs. A link with a property in it (`?p=…`) is a tour for the
 * client; without one you get the builder. That way the link an agent generates
 * is simply this same page again, whatever it is hosted under.
 */
const isTour = Boolean(specFromLocation());

createRoot(document.getElementById('root')).render(
  <StrictMode>{isTour ? <TourApp /> : <StudioApp />}</StrictMode>
);
