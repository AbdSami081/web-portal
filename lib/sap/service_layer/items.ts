import { sapApi } from "./auth"

export const getItem = (itemCode: string) => sapApi.get(`/Items('${itemCode}')`)
export const getItems = () => sapApi.get('/Items')