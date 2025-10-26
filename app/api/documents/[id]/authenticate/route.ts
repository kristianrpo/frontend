import { NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { 
  validateAuth, 
  getAccessToken, 
  makeDocumentsRequest, 
  handleDocumentsError,
  createDocumentsSuccessResponse,
  createDocumentsErrorResponse,
  extractDocumentsErrorInfo
} from '@/lib/documents-utils'

const DOCUMENTS_BASE = process.env.DOCUMENTS_BASE_URL

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const cookieStore = await cookies()
    
    const authError = validateAuth(cookieStore)
    if (authError) {
      return createDocumentsErrorResponse(authError, 401, 'MISSING_TOKEN')
    }

    const documentId = resolvedParams.id
    if (!documentId) {
      return createDocumentsErrorResponse('ID de documento requerido', 400, 'MISSING_DOCUMENT_ID')
    }

    if (!DOCUMENTS_BASE) {
      return createDocumentsErrorResponse('Microservicio de documentos no configurado', 500, 'SERVICE_NOT_CONFIGURED')
    }

    const accessToken = getAccessToken(cookieStore)
    
    const { response, data } = await makeDocumentsRequest(
      `/documents/${documentId}/request-authentication`,
      'POST',
      undefined,
      {
        'Authorization': `Bearer ${accessToken}`
      }
    )

    if (response.ok) {
      return createDocumentsSuccessResponse(data)
    }

    const errorInfo = extractDocumentsErrorInfo(data, response, `/documents/${documentId}/request-authentication`)
    return createDocumentsErrorResponse(
      errorInfo.error,
      errorInfo.status,
      errorInfo.code,
      errorInfo.details,
      errorInfo.url
    )

  } catch (error) {
    const resolvedParams = await params
    return handleDocumentsError(error, `/documents/${resolvedParams.id}/request-authentication`)
  }
}
