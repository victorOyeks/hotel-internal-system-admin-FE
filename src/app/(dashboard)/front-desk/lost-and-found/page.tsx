import { LostAndFoundPage } from "@/components/roles/front-desk/lost-&-found"

function Page() {
  return (
    <LostAndFoundPage
        data={[]}
        paginationMeta={{
          first: true,
            last: true,
            pageNumber: 0,
            pageSize: 10,
            totalElements: 0,
            totalPages: 0,
        }}
    />
  )
}

export default Page