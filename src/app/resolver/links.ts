import { inject } from "@angular/core";
import { ResolveFn } from "@angular/router";
import { IDBService } from "../services/idb";
import { Link } from "../models/link";

export const linksResolver: ResolveFn<Link[]> = async () => {
  const idbService = inject(IDBService);
  return idbService.getAllLinks();
};
