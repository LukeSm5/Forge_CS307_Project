import { styles } from "@/app/profile/settings.Style";
import { View, Text} from "@/components/Themed";

export type Status = { type: "ok" | "err"; msg: string } | null;
export function StatusBanner({ status }: { status: Status }) {
  if (!status) return null;
  return (
    <View
      style={[
        styles.statusBanner,
        status.type === "ok" ? styles.statusOk : styles.statusErr,
      ]}
    >
      <Text style={styles.statusText}>{status.msg}</Text>
    </View>
  );
}