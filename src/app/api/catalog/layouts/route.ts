import { NextRequest, NextResponse } from 'next/server';
import { saveLayoutConfig, getLayoutConfig, getAllLayoutConfigs } from '@/lib/catalog/layout-storage';

/**
 * GET /api/catalog/layouts
 * Query params:
 *   - objectApiName: filter by object
 *   - layoutType: filter by type (detail|edit|list)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const objectApiName = searchParams.get('objectApiName');
    const layoutType = searchParams.get('layoutType') as 'detail' | 'edit' | 'list' | null;

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
 * Body: { objectApiName, layoutType, sections }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { objectApiName, layoutType, sections } = body;

    if (!objectApiName || !layoutType || !sections) {
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
