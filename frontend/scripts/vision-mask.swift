// vision-mask.swift — Máscara del sujeto (recorte de sujetos de macOS, Vision). Todo en local.
// Uso: swift scripts/vision-mask.swift <foto> <mascara.png>
import Foundation
import Vision
import CoreImage
import ImageIO
import UniformTypeIdentifiers

let args = CommandLine.arguments
guard args.count == 3 else { print("uso: mask <entrada> <mascara.png>"); exit(1) }
let input = URL(fileURLWithPath: args[1])
let output = URL(fileURLWithPath: args[2])

let handler = VNImageRequestHandler(url: input, options: [:])
let request = VNGenerateForegroundInstanceMaskRequest()
do {
  try handler.perform([request])
  guard let result = request.results?.first else { print("sin sujeto"); exit(2) }
  print("instancias:", result.allInstances.count)
  let buffer = try result.generateScaledMaskForImage(forInstances: result.allInstances, from: handler)
  let ci = CIImage(cvPixelBuffer: buffer)
  let ctx = CIContext()
  guard let cg = ctx.createCGImage(ci, from: ci.extent, format: .L8, colorSpace: CGColorSpaceCreateDeviceGray()) else { print("sin imagen"); exit(3) }
  let dest = CGImageDestinationCreateWithURL(output as CFURL, UTType.png.identifier as CFString, 1, nil)!
  CGImageDestinationAddImage(dest, cg, nil)
  CGImageDestinationFinalize(dest)
  print("máscara:", cg.width, "x", cg.height)
} catch {
  print("error:", error); exit(4)
}
