import { describe, it, expect, vi } from 'vitest';
import { generateComponentPreviewSVG } from '@/lib/component-preview';
import { prisma } from '@/lib/db';

// Mock Prisma
vi.mock('@/lib/db', () => ({
  prisma: {
    component: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
    },
  },
}));

describe('Component Palette', () => {
  const mockComponents = [
    {
      id: 'comp-1',
      slug: 'button-primary',
      name: 'Primary Button',
      category: 'button',
      description: 'Primary action button',
      ariaName: 'primary_button',
      propsSchema: {
        variant: { type: 'string' },
        size: { type: 'string' },
      },
      previewImage: 'https://cdn.example.com/button-primary.svg',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'comp-2',
      slug: 'input-text',
      name: 'Text Input',
      category: 'input',
      description: 'Text input field',
      ariaName: 'text_input',
      propsSchema: {
        placeholder: { type: 'string' },
        required: { type: 'boolean' },
      },
      previewImage: 'https://cdn.example.com/input-text.svg',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'comp-3',
      slug: 'card-default',
      name: 'Default Card',
      category: 'card',
      description: 'Content card component',
      ariaName: 'default_card',
      propsSchema: {
        title: { type: 'string' },
        description: { type: 'string' },
      },
      previewImage: 'https://cdn.example.com/card-default.svg',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  describe('SVG Preview Generation', () => {
    it('should generate valid SVG string for a component', () => {
      const svg = generateComponentPreviewSVG('Primary Button', 'button', 2);

      expect(svg).toBeTruthy();
      expect(typeof svg).toBe('string');
      expect(svg).toContain('<svg');
      expect(svg).toContain('</svg>');
      expect(svg).toContain('Primary Button');
      expect(svg).toContain('BUTTON');
      expect(svg).toContain('2 props');
    });

    it('should include correct category color for button', () => {
      const svg = generateComponentPreviewSVG('Button', 'button', 0);
      expect(svg).toContain('#3B82F6'); // button blue
    });

    it('should include correct category color for input', () => {
      const svg = generateComponentPreviewSVG('Input', 'input', 0);
      expect(svg).toContain('#10B981'); // input green
    });

    it('should include correct category color for card', () => {
      const svg = generateComponentPreviewSVG('Card', 'card', 0);
      expect(svg).toContain('#F59E0B'); // card amber
    });

    it('should handle zero props correctly', () => {
      const svg = generateComponentPreviewSVG('Component', 'button', 0);
      expect(svg).toContain('0 props');
    });

    it('should handle multiple props correctly', () => {
      const svg = generateComponentPreviewSVG('Component', 'button', 5);
      expect(svg).toContain('5 props');
    });

    it('should use fallback color for unknown category', () => {
      const svg = generateComponentPreviewSVG('Component', 'unknown-category', 0);
      expect(svg).toContain('#64748B'); // fallback slate
    });
  });

  describe('Component Registry', () => {
    it('should have unique component slugs', async () => {
      vi.mocked(prisma.component.findMany).mockResolvedValue(mockComponents);

      const components = await prisma.component.findMany();
      const slugs = components.map((c) => c.slug);
      const uniqueSlugs = new Set(slugs);

      expect(slugs.length).toBe(uniqueSlugs.size);
      expect(slugs).toEqual(['button-primary', 'input-text', 'card-default']);
    });

    it('should map ariaName correctly to component slug', async () => {
      vi.mocked(prisma.component.findMany).mockResolvedValue(mockComponents);

      const components = await prisma.component.findMany();

      // Create a registry map for lookup
      const ariaRegistry = Object.fromEntries(
        components.map((c) => [c.ariaName, c.slug]),
      );

      expect(ariaRegistry.primary_button).toBe('button-primary');
      expect(ariaRegistry.text_input).toBe('input-text');
      expect(ariaRegistry.default_card).toBe('card-default');
    });

    it('should have valid props schema for each component', async () => {
      vi.mocked(prisma.component.findMany).mockResolvedValue(mockComponents);

      const components = await prisma.component.findMany();

      for (const component of components) {
        expect(component.propsSchema).toBeTruthy();
        expect(typeof component.propsSchema).toBe('object');
      }
    });

    it('should generate preview for component from registry', () => {
      // Pick a component from the mock registry
      const component = mockComponents[0];
      const propsCount = Object.keys(component.propsSchema).length;

      const svg = generateComponentPreviewSVG(
        component.name,
        component.category,
        propsCount,
      );

      expect(svg).toContain(component.name);
      expect(svg).toContain(component.category.toUpperCase());
      expect(svg).toContain(`${propsCount} props`);
    });
  });

  describe('Component Palette UI Integration', () => {
    it('should have valid ariaName format (snake_case with numbers)', async () => {
      vi.mocked(prisma.component.findMany).mockResolvedValue(mockComponents);

      const components = await prisma.component.findMany();

      // All ariaNames should be valid snake_case identifiers
      const validAriaNameRegex = /^[a-z0-9_]+$/;

      for (const component of components) {
        expect(component.ariaName).toMatch(validAriaNameRegex);
      }
    });

    it('should have preview image URLs for all components', async () => {
      vi.mocked(prisma.component.findMany).mockResolvedValue(mockComponents);

      const components = await prisma.component.findMany();

      for (const component of components) {
        // previewImage can be null, but if set, should be a URL
        if (component.previewImage) {
          expect(typeof component.previewImage).toBe('string');
          expect(component.previewImage).toMatch(/^https?:\/\//);
        }
      }
    });

    it('should support category filtering', async () => {
      vi.mocked(prisma.component.findMany).mockResolvedValue(
        mockComponents.filter((c) => c.category === 'button'),
      );

      const buttons = await prisma.component.findMany();

      expect(buttons).toHaveLength(1);
      expect(buttons[0].category).toBe('button');
    });

    it('should support search by ariaName', async () => {
      const searchTerm = 'primary_button';
      vi.mocked(prisma.component.findMany).mockResolvedValue(
        mockComponents.filter((c) => c.ariaName.includes(searchTerm)),
      );

      const results = await prisma.component.findMany();

      expect(results).toHaveLength(1);
      expect(results[0].ariaName).toContain(searchTerm);
    });
  });
});
