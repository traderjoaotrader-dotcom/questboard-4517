import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { orpc } from "../lib/api";

export const useGuild = () =>
  useQuery(orpc.guild.dashboard.queryOptions({ refetchOnWindowFocus: true }));
function useAction<
  K extends
    | "accept"
    | "complete"
    | "rename"
    | "saveReward"
    | "deleteReward"
    | "redeem"
    | "completeElite",
>(key: K) {
  const cache = useQueryClient();
  return useMutation(
    orpc.guild[key].mutationOptions({
      onSuccess: () =>
        cache.invalidateQueries({ queryKey: orpc.guild.dashboard.queryOptions().queryKey }),
    }) as any,
  );
}
export const useAccept = () => useAction("accept");
export const useComplete = () => useAction("complete");
export const useRename = () => useAction("rename");
export const useSaveReward = () => useAction("saveReward");
export const useDeleteReward = () => useAction("deleteReward");
export const useRedeem = () => useAction("redeem");
export const useCompleteElite = () => useAction("completeElite");
