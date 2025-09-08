export function generateFTCNumber(): string {
  const year = new Date().getFullYear();
  const storedCounter = localStorage.getItem('ftcCounter');
  let counter = storedCounter ? parseInt(storedCounter) : 0;
  
  counter++;
  localStorage.setItem('ftcCounter', counter.toString());
  
  return `${year}${counter.toString().padStart(3, '0')}`;
}

export function getCurrentDate(): string {
  const now = new Date();
  const day = now.getDate().toString().padStart(2, '0');
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const year = now.getFullYear();
  
  return `${day}/${month}/${year}`;
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}