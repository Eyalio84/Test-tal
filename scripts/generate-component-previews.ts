import 'dotenv/config';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { prisma } from '@/lib/db';
import { r2, R2_BUCKET, R2_PUBLIC_URL } from '@/lib/r2';
import { generateComponentPreviewSVG } from '@/lib/component-preview';

async function generatePreviews() {
  console.log('🎨 Generating component preview images...');

  try {
    // Fetch all components
    const components = await prisma.component.findMany({
      orderBy: { slug: 'asc' },
    });

    if (components.length === 0) {
      console.log('✓ No components found in database');
      return;
    }

    console.log(`Processing ${components.length} components...`);

    for (const component of components) {
      // Generate SVG
      const propsCount = Object.keys(
        (component.propsSchema as Record<string, unknown>) || {},
      ).length;
      const svgContent = generateComponentPreviewSVG(
        component.name,
        component.category,
        propsCount,
      );

      // Upload to R2
      const r2Key = `components/${component.slug}-preview.svg`;
      const buffer = Buffer.from(svgContent, 'utf-8');

      try {
        await r2.send(
          new PutObjectCommand({
            Bucket: R2_BUCKET,
            Key: r2Key,
            Body: buffer,
            ContentType: 'image/svg+xml',
          }),
        );

        console.log(`✓ ${component.slug}: uploaded to ${r2Key}`);

        // Update component with R2 URL
        const previewUrl = `${R2_PUBLIC_URL}/${r2Key}`;
        await prisma.component.update({
          where: { id: component.id },
          data: { previewImage: previewUrl },
        });

        console.log(`  → Updated Component.previewImage: ${previewUrl}`);
      } catch (error) {
        console.error(`✗ Failed to process ${component.slug}:`, error);
        throw error;
      }
    }

    console.log('✅ All previews generated and uploaded');
  } catch (error) {
    console.error('Failed to generate previews:', error);
    process.exit(1);
  }
}

generatePreviews();
