/**
 * Generate SVG preview thumbnail for a component
 * Shows: component name, category, props count
 */
export function generateComponentPreviewSVG(
  name: string,
  category: string,
  propsCount: number = 0,
): string {
  const width = 400;
  const height = 300;

  // Color by category
  const categoryColors: Record<string, string> = {
    button: '#3B82F6', // blue
    input: '#10B981', // green
    card: '#F59E0B', // amber
    overlay: '#8B5CF6', // purple
    nav: '#EC4899', // pink
    section: '#06B6D4', // cyan
    badge: '#14B8A6', // teal
    modal: '#EF4444', // red
    dropdown: '#6366F1', // indigo
    slider: '#84CC16', // lime
  };

  const color = categoryColors[category] || '#64748B';

  return `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <!-- Background -->
  <rect width="${width}" height="${height}" fill="#0F172A"/>
  
  <!-- Header bar with category color -->
  <rect width="${width}" height="60" fill="${color}"/>
  
  <!-- Category text -->
  <text x="20" y="40" font-family="Inter, sans-serif" font-size="14" fill="white" font-weight="600">
    ${category.toUpperCase()}
  </text>
  
  <!-- Component name -->
  <text x="20" y="100" font-family="Inter, sans-serif" font-size="28" fill="white" font-weight="bold">
    ${name}
  </text>
  
  <!-- Props count -->
  <text x="20" y="160" font-family="Inter, sans-serif" font-size="14" fill="#94A3B8">
    ${propsCount} prop${propsCount !== 1 ? 's' : ''}
  </text>
  
  <!-- Decorative footer -->
  <rect y="${height - 40}" width="${width}" height="40" fill="${color}" opacity="0.1"/>
  <text x="20" y="${height - 15}" font-family="Inter, sans-serif" font-size="12" fill="#64748B">
    Component Preview
  </text>
</svg>`;
}
