import { json } from '@remix-run/node';
import type { LoaderFunctionArgs } from '@remix-run/node';
import { MasterDataService } from '~/lib/sap/service_layer/masterDataService';

export async function loader({ request }: LoaderFunctionArgs) {
  try {
    const uoms = await MasterDataService.getUOMs();
    return json({ uoms });
  } catch (error: any) {
    console.error('❌ Failed to fetch unit of measures:', error);
    return json({ error: 'Failed to fetch unit of measures' }, { status: 500 });
  }
}
