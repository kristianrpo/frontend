import { cookies } from 'next/headers'
import { 
  DOCUMENTS_BASE,
  createDocumentsErrorResponse,
  createDocumentsSuccessResponse,
  handleDocumentsError,
  validateAuth,
  getAccessToken,
  makeDocumentsRequest,
  extractDocumentsErrorInfo
} from '@/lib/documents-utils'

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // En Next.js 16, params es una Promise y debe ser awaited
    const resolvedParams = await params
    const cookieStore = await cookies()
    
    // Validar autenticación
    const authError = validateAuth(cookieStore)
    if (authError) {
      return createDocumentsErrorResponse(authError, 401, 'MISSING_TOKEN')
    }

    const documentId = resolvedParams.id
    if (!documentId) {
      return createDocumentsErrorResponse('ID de documento requerido', 400, 'MISSING_DOCUMENT_ID')
    }

    // Eliminar documento del microservicio
    if (!DOCUMENTS_BASE) {
      return createDocumentsErrorResponse('Microservicio de documentos no configurado', 500, 'SERVICE_NOT_CONFIGURED')
    }

    const accessToken = getAccessToken(cookieStore)
    
    const { response, data } = await makeDocumentsRequest(
      `/documents/${documentId}`,
      'DELETE',
      undefined,
      {
        'Authorization': `Bearer ${accessToken}`
      }
    )

    if (response.ok) {
      return createDocumentsSuccessResponse(data)
    }

    const errorInfo = extractDocumentsErrorInfo(data, response, `/documents/${documentId}`)
    return createDocumentsErrorResponse(
      errorInfo.error,
      errorInfo.status,
      errorInfo.code,
      errorInfo.details,
      errorInfo.url
    )

  } catch (error) {
    const resolvedParams = await params
    return handleDocumentsError(error, `/documents/${resolvedParams.id}`)
  }
}
