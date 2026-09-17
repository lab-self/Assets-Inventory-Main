// Official model names; the form preserves unlisted and legacy models via Other.
// Sources and catalog scope: docs/gpu-catalog.md.
export const gpuModels = [
  ...["5090", "5080", "5070 Ti", "5070", "5060 Ti", "5060", "5050", "4090", "4080 SUPER", "4080", "4070 Ti SUPER", "4070 Ti", "4070 SUPER", "4070", "4060 Ti", "4060", "3090 Ti", "3090", "3080 Ti", "3080", "3070 Ti", "3070", "3060 Ti", "3060", "3050", "2080 Ti", "2080 SUPER", "2080", "2070 SUPER", "2070", "2060 SUPER", "2060"].map(model => `NVIDIA GeForce RTX ${model}`),
  ...["1660 Ti", "1660 SUPER", "1660", "1650 SUPER", "1650", "1080 Ti", "1080", "1070 Ti", "1070", "1060", "1050 Ti", "1050"].map(model => `NVIDIA GeForce GTX ${model}`),
  ...["A6000", "A5000", "A4500", "A4000", "A2000"].map(model => `NVIDIA RTX ${model}`),
  ...["6000 Ada Generation", "5000 Ada Generation", "4500 Ada Generation", "4000 Ada Generation", "2000 Ada Generation"].map(model => `NVIDIA RTX ${model}`),
  ...["RTX 8000", "RTX 6000", "RTX 5000", "RTX 4000", "P6000", "P5000", "P4000", "P2000", "P1000", "P620", "P600", "P400"].map(model => `NVIDIA Quadro ${model}`),
  ...["9070 XT", "9070", "9060 XT", "7900 XTX", "7900 XT", "7900 GRE", "7800 XT", "7700 XT", "7600 XT", "7600", "6950 XT", "6900 XT", "6800 XT", "6800", "6750 XT", "6700 XT", "6650 XT", "6600 XT", "6600", "6500 XT", "6400", "5700 XT", "5700", "5600 XT", "5500 XT", "590", "580", "570", "560", "550"].map(model => `AMD Radeon RX ${model}`),
  ...["W7900", "W7800", "W7700", "W7600", "W7500", "W6800", "W6600", "W6400"].map(model => `AMD Radeon PRO ${model}`),
  ...["B580", "B570", "A770", "A750", "A580", "A380", "A310"].map(model => `Intel Arc ${model}`),
  "Intel Iris Xe Graphics", "Intel Iris Plus Graphics", "Intel UHD Graphics", "Intel HD Graphics",
  "AMD Radeon Graphics", "Apple M1", "Apple M1 Pro", "Apple M1 Max", "Apple M1 Ultra",
  "Apple M2", "Apple M2 Pro", "Apple M2 Max", "Apple M2 Ultra", "Apple M3", "Apple M3 Pro", "Apple M3 Max", "Apple M4", "Apple M4 Pro", "Apple M4 Max",
];
