import Replicate from "replicate";

export function getReplicateClient() {
  const token = process.env.REPLICATE_API_TOKEN;
  if (!token) {
    throw new Error(
      "Missing REPLICATE_API_TOKEN. Create a .env from .env.example."
    );
  }
  return new Replicate({ auth: token });
}

export function getReplicateModel() {
  const model = process.env.REPLICATE_MODEL;
  if (!model) {
    throw new Error(
      "Missing REPLICATE_MODEL. Set it to a model version string (owner/name:version)."
    );
  }
  return model;
}

