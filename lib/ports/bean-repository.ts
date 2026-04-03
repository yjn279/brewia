import type { Bean } from '@/lib/types'

export interface CreateBeanParams {
  name: string
  country: Bean['country']
  roast: Bean['roast']
  roaster: string | null
  region: string | null
  farm: string | null
  process: string | null
  variety: string | null
  notes: string | null
}

export interface BeanRepository {
  create(input: CreateBeanParams): Promise<Bean>
}
