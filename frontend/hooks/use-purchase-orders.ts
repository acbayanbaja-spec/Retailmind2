"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/providers/auth-provider";
import {
  approvePurchaseOrder,
  archivePurchaseOrder,
  cancelPurchaseOrder,
  createPurchaseOrder,
  getPurchaseOrder,
  listPoProducts,
  listPurchaseOrders,
  markPurchaseOrderOrdered,
  PoProductsParams,
  PurchaseOrderListParams,
  receivePurchaseOrder,
  submitPurchaseOrder,
  updatePurchaseOrder,
} from "@/services/purchase-order.service";

export function usePurchaseOrderList(params: PurchaseOrderListParams) {
  const { accessToken, isAuthenticated } = useAuth();

  return useQuery({
    queryKey: ["purchase-orders", params],
    queryFn: () => listPurchaseOrders(accessToken!, params),
    enabled: isAuthenticated && !!accessToken,
  });
}

export function usePurchaseOrder(id: string | null) {
  const { accessToken, isAuthenticated } = useAuth();

  return useQuery({
    queryKey: ["purchase-orders", id],
    queryFn: () => getPurchaseOrder(accessToken!, id!),
    enabled: isAuthenticated && !!accessToken && !!id,
  });
}

export function usePoProducts(params: PoProductsParams | null) {
  const { accessToken, isAuthenticated } = useAuth();

  return useQuery({
    queryKey: ["po-products", params],
    queryFn: () => listPoProducts(accessToken!, params!),
    enabled: isAuthenticated && !!accessToken && !!params?.supplierId,
  });
}

export function usePurchaseOrderMutations() {
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
    queryClient.invalidateQueries({ queryKey: ["inventory"] });
    queryClient.invalidateQueries({ queryKey: ["products"] });
    queryClient.invalidateQueries({ queryKey: ["dashboard"] });
  };

  const create = useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      createPurchaseOrder(accessToken!, payload),
    onSuccess: invalidate,
  });

  const update = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: Record<string, unknown>;
    }) => updatePurchaseOrder(accessToken!, id, payload),
    onSuccess: invalidate,
  });

  const submit = useMutation({
    mutationFn: (id: string) => submitPurchaseOrder(accessToken!, id),
    onSuccess: invalidate,
  });

  const approve = useMutation({
    mutationFn: (id: string) => approvePurchaseOrder(accessToken!, id),
    onSuccess: invalidate,
  });

  const markOrdered = useMutation({
    mutationFn: (id: string) => markPurchaseOrderOrdered(accessToken!, id),
    onSuccess: invalidate,
  });

  const receive = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: Record<string, unknown>;
    }) => receivePurchaseOrder(accessToken!, id, payload),
    onSuccess: invalidate,
  });

  const cancel = useMutation({
    mutationFn: (id: string) => cancelPurchaseOrder(accessToken!, id),
    onSuccess: invalidate,
  });

  const archive = useMutation({
    mutationFn: (id: string) => archivePurchaseOrder(accessToken!, id),
    onSuccess: invalidate,
  });

  return {
    create,
    update,
    submit,
    approve,
    markOrdered,
    receive,
    cancel,
    archive,
  };
}
