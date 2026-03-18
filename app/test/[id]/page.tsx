

import TestEngine from "@/components/TestEngine";   // Component chứa giao diện và logic của bài test

export default async function TestPage({ params }: { params: { id: string } }) {     // { params } -> Hệ thống sẽ cho url chứa nhiều data nhưng { params } sẽ destructure data được gửi và chỉ lấy phần params -> Destructuring
                                                                                     // vì đường dẫn file là app/test/[id] => nextjs bảo bất cứ cái gì sau test/ thì gắn nó là id => params sẽ = id để lấy mã bài thi \
                                                                                     // id là tên mà dev đặt ra để hứng giá trị từ url, quy định là nó dạng string, id ở đây chưa chứa giá trị thực
                                                                                  
  // hiện tại, param đang chứa như sau: params = { id: "123" }
    const { id } = await params;       // thay vì viết duLieu = await params; rồi id = params.id thì nó bóc tách (destructure) ra từ params để gán vào id

    return <TestEngine testId={id} />;   // Truyền id vừa lấy được từ url vào công cụ in bài test theo id
}
