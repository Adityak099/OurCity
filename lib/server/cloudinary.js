import { v2 as cloudinary } from "cloudinary";
import { Readable } from "node:stream";

function getCloudinaryClient() {
  const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } =
    process.env;

  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
    throw new Error(
      "Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.",
    );
  }

  cloudinary.config({
    cloud_name: CLOUDINARY_CLOUD_NAME,
    api_key: CLOUDINARY_API_KEY,
    api_secret: CLOUDINARY_API_SECRET,
    secure: true,
  });

  return cloudinary;
}

export async function uploadComplaintImage(buffer) {
  const client = getCloudinaryClient();

  return new Promise((resolve, reject) => {
    const uploadStream = client.uploader.upload_stream(
      {
        folder: "ourcity/reports",
        resource_type: "image",
      },
      (error, result) => {
        if (error) {
          reject(error);
          return;
        }

        if (!result?.secure_url || !result.public_id) {
          reject(new Error("Cloudinary returned an incomplete upload result."));
          return;
        }

        resolve({
          secureUrl: result.secure_url,
          publicId: result.public_id,
        });
      },
    );

    Readable.from([buffer]).pipe(uploadStream);
  });
}

export async function deleteComplaintImage(publicId) {
  const client = getCloudinaryClient();
  const result = await client.uploader.destroy(publicId, {
    resource_type: "image",
  });

  if (!["ok", "not found"].includes(result.result)) {
    throw new Error("Cloudinary could not remove the failed report upload.");
  }
}
