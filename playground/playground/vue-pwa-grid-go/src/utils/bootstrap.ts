// Bootstrap initialization utility
import { Tooltip, Popover, Dropdown } from 'bootstrap';

export function initializeBootstrap() {
  // Initialize tooltips
  const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
  tooltipTriggerList.map(function (tooltipTriggerEl) {
    return new Tooltip(tooltipTriggerEl);
  });

  // Initialize popovers
  const popoverTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="popover"]'));
  popoverTriggerList.map(function (popoverTriggerEl) {
    return new Popover(popoverTriggerEl);
  });

  // Initialize dropdowns
  const dropdownElementList = [].slice.call(document.querySelectorAll('.dropdown-toggle'));
  dropdownElementList.map(function (dropdownToggleEl) {
    return new Dropdown(dropdownToggleEl);
  });
}

export function destroyBootstrap() {
  // Destroy tooltips
  const tooltipList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
  tooltipList.forEach(el => {
    const tooltip = Tooltip.getInstance(el);
    if (tooltip) {
      tooltip.dispose();
    }
  });

  // Destroy popovers
  const popoverList = [].slice.call(document.querySelectorAll('[data-bs-toggle="popover"]'));
  popoverList.forEach(el => {
    const popover = Popover.getInstance(el);
    if (popover) {
      popover.dispose();
    }
  });
}
