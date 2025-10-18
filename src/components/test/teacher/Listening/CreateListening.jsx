import CreatePartForm from "../Detail/CreatePartForm";

const CreateListening = ({ idDe, exam }) => {
  return (
    <>
      <CreatePartForm
        idDe={idDe}
        loaiDe="Nghe"
        onSuccess={(data) => console.log(data)}
      />
      <div>
        <h2>Chỉnh sửa đề thi Nghe</h2>
        {/* Form chỉnh sửa đề thi Nghe */}
      </div>
    </>
  );
};

export default CreateListening;
