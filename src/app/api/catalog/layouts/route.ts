import { NextRequest, NextResponse } from 'next/server';
import { saveLayoutConfig, getLayoutConfig, getAllLayoutConfigs, type LayoutConfig } from '@/lib/catalog/layout-storage';

/**
 * GET /api/catalog/layouts
 * Query params:
 *   - objectApiName / object_api_name: filter by object
 *   - layoutType / layout_type: filter by type (detail|edit|list)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const objectApiName = searchParams.get('objectApiName') || searchParams.get('object_api_name');
    const layoutType = (searchParams.get('layoutType') || searchParams.get('layout_type')) as 'detail' | 'edit' | 'list' | null;

    if (objectApiName && layoutType) {
      const config = getLayoutConfig(objectApiName, layoutType);
      return NextResponse.json({
        success: true,
        data: config || null,
      });
    }

    if (objectApiName) {
      const configs = getAllLayoutConfigs(objectApiName);
      return NextResponse.json({
        success: true,
        data: configs,
      });
    }

    return NextResponse.json(
      { error: 'objectApiName query parameter is required' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Failed to fetch layouts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch layout configurations' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/catalog/layouts
 * Body: { objectApiName, layoutType, sections } (accepts both camelCase and snake_case)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
const objectApiName = body.objectApiName || body.object_api_name;
    const layoutType = body.layoutType || body.layout_type;
    const { sections } = body as Partial<LayoutConfig>;

    if (!objectApiName || !layoutType || !Array.isArray(sections)) {
      return NextResponse.json(
        { error: 'Missing required fields: objectApiName, layoutType, sections' },
        { status: 400 }
      );
    }

    const result = saveLayoutConfig({
      objectApiName,
      layoutType,
      sections,
    });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Failed to save layout:', error);
    return NextResponse.json(
      { error: 'Failed to save layout configuration' },
      { status: 500 }
    );
  }
}
