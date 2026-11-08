import { FoliosScreen } from "@/components/roles/front-office/folios";
import { data } from "@hospio/api/data";

export const dynamic = "force-dynamic";

export default async function FrontDeskFoliosPage() {
	const [folios, terminals] = await Promise.all([data.folios.list(), data.payments.terminals()]);
	return <FoliosScreen folios={folios} terminals={terminals} />;
}
