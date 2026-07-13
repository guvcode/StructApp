#!/usr/bin/env node
/**
 * Generate proper taxonomy JSON from the WTP Asset Library Excel data.
 * 
 * The Excel has 5 hierarchy levels + deficiency mechanism codes as tags:
 *   Category → Equipment Type → Component → Subcomponent → Focus Area
 *   [deficiency_mechanisms: string[]]  <-- tags, NOT separate nodes
 *
 * The current API incorrectly creates 7 levels by treating deficiency
 * codes as separate hierarchy levels. This script produces the correct structure.
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const uuidv4 = () => crypto.randomUUID();

// ============================================================
// RAW EXCEL ROWS (from Asset Library sheet)
// ============================================================
// Each row: [Asset Category, Equipment Type, Component, Subcomponent, Focus Area, Deficiency Mechanisms]
const EXCEL_ROWS = [
  ["Process Equipment (Mechanical)", "Influent Screen / Bar Rack", "Screen Assembly", "Bar Rack / Mesh Panel", "Section loss, blinding/plugging, distortion of bars from grit and debris loading", "CML - Corrosion & Material Loss; FLW - Flow-Induced Damage"],
  ["Process Equipment (Mechanical)", "Influent Screen / Bar Rack", "Screen Assembly", "Guide Rails / Frame", "Frame corrosion, guide rail wear and misalignment affecting screen travel", "CML - Corrosion & Material Loss; DFI - Deformation & Mechanical Damage"],
  ["Process Equipment (Mechanical)", "Influent Screen / Bar Rack", "Support Structure", "Anchor Bolts / Base", "Anchorage integrity and foundation interface condition", "CFI - Connection & Joint Failures; FDS - Foundation & Settlement"],
  ["Process Equipment (Mechanical)", "Equalization / Sump Tank", "Tank Shell / Wall", "Wall Plate (steel) or Concrete Wall Panel", "Wall thinning/corrosion (steel) or cracking, spalling, sulfate attack (concrete) from raw mine-impacted water", "CML - Corrosion & Material Loss; CND - Concrete Deterioration"],
  ["Process Equipment (Mechanical)", "Equalization / Sump Tank", "Tank Shell / Wall", "Wall-to-Floor Joint / Waterstop", "Joint leakage, waterstop failure, moisture migration", "EWF - Envelope Failure; CFI - Connection & Joint Failures"],
  ["Process Equipment (Mechanical)", "Equalization / Sump Tank", "Floor / Sump", "Base Slab", "Grit/silt abrasion, cracking, differential settlement", "FLW - Flow-Induced Damage; CND - Concrete Deterioration; FDS - Foundation & Settlement"],
  ["Process Equipment (Mechanical)", "Equalization / Sump Tank", "Access", "Manway / Hatch, Platform", "Corrosion of fittings, seal condition, safe access integrity", "CML - Corrosion & Material Loss; EWF - Envelope Failure"],
  ["Process Equipment (Mechanical)", "Rapid Mix / Reaction Tank", "Tank Shell", "Wall / Internal Lining", "Chemical and abrasive attack from lime slurry, lining breakdown exposing substrate", "CML - Corrosion & Material Loss; FLW - Flow-Induced Damage"],
  ["Process Equipment (Mechanical)", "Rapid Mix / Reaction Tank", "Agitator / Mixer", "Shaft, Impeller, Mounting", "Fatigue cracking, erosion of wetted parts, mounting bolt integrity", "DFI - Deformation & Mechanical Damage; FLW - Flow-Induced Damage; CFI - Connection & Joint Failures"],
  ["Process Equipment (Mechanical)", "Rapid Mix / Reaction Tank", "Support / Foundation", "Baseplate, Anchor Bolts", "Vibration-induced loosening, grout condition under mixer drive", "CFI - Connection & Joint Failures; FDS - Foundation & Settlement"],
  ["Process Equipment (Mechanical)", "Lime Reactor / HDS Reaction Tank", "Tank Shell", "Wall Plate, Coating/Lining", "Abrasive and corrosive wear from lime and recycled high-density sludge, coating breakdown", "CML - Corrosion & Material Loss; FLW - Flow-Induced Damage"],
  ["Process Equipment (Mechanical)", "Lime Reactor / HDS Reaction Tank", "Internals", "Agitator/Impeller, Aeration Diffusers, Baffles", "Erosion of agitator and diffusers, fatigue cracking, attachment weld condition", "FLW - Flow-Induced Damage; CRK - Cracking Mechanisms; DFI - Deformation & Mechanical Damage"],
  ["Process Equipment (Mechanical)", "Lime Reactor / HDS Reaction Tank", "Support / Foundation", "Skirt/Legs, Anchor Bolts, Foundation", "Load path integrity, settlement, anchorage under continuous agitation loading", "FDS - Foundation & Settlement; CFI - Connection & Joint Failures"],
  ["Process Equipment (Mechanical)", "Reactivator Clarifier / Thickener", "Tank Shell / Walls", "Wall Plate (steel) or Concrete Wall", "Wall thinning/corrosion or sulfate attack from sustained contact with mine-impacted water and sludge", "CML - Corrosion & Material Loss; CND - Concrete Deterioration"],
  ["Process Equipment (Mechanical)", "Reactivator Clarifier / Thickener", "Drive Mechanism", "Center Column, Bridge/Walkway, Drive Support", "Structural integrity of center column and bridge, corrosion, drive misalignment", "CML - Corrosion & Material Loss; DFI - Deformation & Mechanical Damage; CFI - Connection & Joint Failures"],
  ["Process Equipment (Mechanical)", "Reactivator Clarifier / Thickener", "Rake / Scraper Mechanism", "Rake Arms, Scraper Blades", "Abrasive wear from settled/thickened sludge, bent or corroded arms, torque overload", "FLW - Flow-Induced Damage; DFI - Deformation & Mechanical Damage"],
  ["Process Equipment (Mechanical)", "Reactivator Clarifier / Thickener", "Launder & Weir", "Overflow Launder, Weir Plates", "Cracking/spalling (concrete) or corrosion (steel), level control accuracy", "CND - Concrete Deterioration; CML - Corrosion & Material Loss"],
  ["Process Equipment (Mechanical)", "Reactivator Clarifier / Thickener", "Underflow System", "Cone/Hopper, Underflow Piping", "Abrasion from high-density sludge underflow, plugging, structural integrity of cone", "FLW - Flow-Induced Damage; OPR - Operational & Process-Related Damage"],
  ["Process Equipment (Mechanical)", "Lime Silo & Slaking System", "Silo", "Shell / Walls", "Internal abrasion from lime, external atmospheric corrosion, coating condition", "CML - Corrosion & Material Loss; FLW - Flow-Induced Damage"],
  ["Process Equipment (Mechanical)", "Lime Silo & Slaking System", "Silo", "Support Legs / Skirt", "Buckling, corrosion, anchorage of support structure", "DFI - Deformation & Mechanical Damage; CML - Corrosion & Material Loss; CFI - Connection & Joint Failures"],
  ["Process Equipment (Mechanical)", "Lime Silo & Slaking System", "Silo", "Discharge Cone / Feeder", "Wear/abrasion, arching/blockage, structural integrity of cone under cyclic loading", "FLW - Flow-Induced Damage; OPR - Operational & Process-Related Damage"],
  ["Process Equipment (Mechanical)", "Lime Silo & Slaking System", "Slaker Unit", "Slaking Chamber, Agitator", "Thermal and chemical attack from exothermic slaking reaction, erosion of wetted parts", "THR - Fire & Thermal Damage; FLW - Flow-Induced Damage"],
  ["Process Equipment (Mechanical)", "Chemical Storage Tank (polymer/coagulant/caustic/acid)", "Tank Shell", "FRP / Steel / Poly Wall", "Chemical compatibility, UV degradation (FRP), wall thinning", "CML - Corrosion & Material Loss; ENV - Environmental & External Damage"],
  ["Process Equipment (Mechanical)", "Chemical Storage Tank (polymer/coagulant/caustic/acid)", "Secondary Containment", "Containment Bund/Berm, Liner", "Containment integrity, concrete cracking, liner degradation from chemical exposure", "CND - Concrete Deterioration; EWF - Envelope Failure"],
  ["Process Equipment (Mechanical)", "Chemical Storage Tank (polymer/coagulant/caustic/acid)", "Nozzles / Venting", "Fill/Vent Nozzles, Overflow", "Leak points, corrosion at connections, vent blockage", "CFI - Connection & Joint Failures; CML - Corrosion & Material Loss"],
  ["Process Equipment (Mechanical)", "Chemical Dosing Skid / Feed Pumps", "Skid Frame", "Base Frame, Anchor Points", "Corrosion from chemical exposure/spillage, frame structural integrity", "CML - Corrosion & Material Loss; DFI - Deformation & Mechanical Damage"],
  ["Process Equipment (Mechanical)", "Chemical Dosing Skid / Feed Pumps", "Metering Pump", "Pump Head, Diaphragm/Seal", "Leakage, chemical attack on seals and diaphragms", "LOC - Leakage / Loss of Containment; CML - Corrosion & Material Loss"],
  ["Process Equipment (Mechanical)", "Chemical Dosing Skid / Feed Pumps", "Piping / Tubing", "Chemical Feed Lines, Fittings", "Chemical corrosion, joint leakage at fittings", "CML - Corrosion & Material Loss; CFI - Connection & Joint Failures"],
  ["Process Equipment (Mechanical)", "Sludge Thickener", "Tank Shell", "Wall Plate / Concrete Wall", "Abrasive and corrosive wear from thickened sludge", "CML - Corrosion & Material Loss; FLW - Flow-Induced Damage"],
  ["Process Equipment (Mechanical)", "Sludge Thickener", "Rake Mechanism", "Rake Arms, Drive Unit", "Wear from high-solids sludge, torque overload, drive support condition", "FLW - Flow-Induced Damage; DFI - Deformation & Mechanical Damage"],
  ["Process Equipment (Mechanical)", "Sludge Dewatering (Filter Press / Belt Press / Centrifuge)", "Frame / Skid", "Main Frame, Hydraulic Cylinder Mounts", "Structural fatigue from cyclic press operation, corrosion of frame members", "CRK - Cracking Mechanisms; CML - Corrosion & Material Loss"],
  ["Process Equipment (Mechanical)", "Sludge Dewatering (Filter Press / Belt Press / Centrifuge)", "Filter Media", "Filter Plates / Belts", "Wear, chemical attack, tearing of filter media", "FLW - Flow-Induced Damage; CML - Corrosion & Material Loss"],
  ["Process Equipment (Mechanical)", "Sludge Dewatering (Filter Press / Belt Press / Centrifuge)", "Feed System", "Feed Pump, Piping", "Abrasion from thickened sludge feed, plugging", "FLW - Flow-Induced Damage; OPR - Operational & Process-Related Damage"],
  ["Process Equipment (Mechanical)", "Media Filter (Sand / Multimedia)", "Filter Vessel / Basin", "Shell (pressure) or Concrete Basin (gravity)", "Corrosion (steel) or cracking (concrete), coating/lining condition", "CML - Corrosion & Material Loss; CND - Concrete Deterioration"],
  ["Process Equipment (Mechanical)", "Media Filter (Sand / Multimedia)", "Underdrain System", "Nozzles/Laterals, Support Plate", "Clogging, structural support of media bed, corrosion of underdrain components", "OPR - Operational & Process-Related Damage; CML - Corrosion & Material Loss"],
  ["Process Equipment (Mechanical)", "Media Filter (Sand / Multimedia)", "Backwash System", "Backwash Piping, Air Scour", "Erosion at high-velocity backwash flow, joint integrity under pressure surges", "FLW - Flow-Induced Damage; CFI - Connection & Joint Failures"],
  ["Process Equipment (Mechanical)", "Membrane System (RO/UF)", "Skid Frame", "Frame, Pressure Vessel Racking", "Structural support of pressure vessels, vibration-induced loosening", "DFI - Deformation & Mechanical Damage; CFI - Connection & Joint Failures"],
  ["Process Equipment (Mechanical)", "Membrane System (RO/UF)", "Pressure Vessels / Housings", "Membrane Housing, End Caps", "Pressure boundary integrity, seal leakage at end caps", "LOC - Leakage / Loss of Containment; CML - Corrosion & Material Loss"],
  ["Process Equipment (Mechanical)", "Membrane System (RO/UF)", "Piping Manifolds", "Feed / Permeate / Concentrate Headers", "High-pressure joint integrity, concentrate-stream corrosion (elevated salinity/metals)", "CFI - Connection & Joint Failures; CML - Corrosion & Material Loss"],
  ["Process Equipment (Mechanical)", "Neutralization Tank", "Tank Shell", "Wall / Lining", "Chemical attack from pH swings, lining integrity", "CML - Corrosion & Material Loss; EWF - Envelope Failure"],
  ["Process Equipment (Mechanical)", "Neutralization Tank", "Mixer / Agitator", "Shaft, pH Probe Mount", "Corrosion, fatigue cracking, instrumentation mounting integrity", "CML - Corrosion & Material Loss; CRK - Cracking Mechanisms"],
  ["Process Equipment (Mechanical)", "Pumps (Transfer / Recycle / Sludge / Feed / Effluent)", "Casing / Volute", "Casing, Wear Rings", "Erosion/abrasion from slurry, corrosion of casing", "CML - Corrosion & Material Loss; FLW - Flow-Induced Damage"],
  ["Process Equipment (Mechanical)", "Pumps (Transfer / Recycle / Sludge / Feed / Effluent)", "Baseplate & Foundation", "Baseplate, Grout, Anchor Bolts", "Grout condition, anchorage integrity, alignment", "FDS - Foundation & Settlement; CFI - Connection & Joint Failures; DFI - Deformation & Mechanical Damage"],
  ["Process Equipment (Mechanical)", "Pumps (Transfer / Recycle / Sludge / Feed / Effluent)", "Seal / Packing", "Mechanical Seal, Packing Gland", "Leakage, seal wear from abrasive slurry service", "LOC - Leakage / Loss of Containment"],
  ["Process Equipment (Mechanical)", "Pumps (Transfer / Recycle / Sludge / Feed / Effluent)", "Bearing Housing", "Bearings, Coupling Guard", "Vibration, overheating, guarding integrity", "DFI - Deformation & Mechanical Damage; GHK - General Housekeeping & Maintenance"],
  ["Process Equipment (Mechanical)", "Piping Systems (Process / Chemical / Slurry-Sludge Lines)", "Straight Runs", "Carbon Steel / HDPE / Lined Pipe", "Wall thinning, internal lining wear (slurry lines), external atmospheric corrosion", "CML - Corrosion & Material Loss; FLW - Flow-Induced Damage"],
  ["Process Equipment (Mechanical)", "Piping Systems (Process / Chemical / Slurry-Sludge Lines)", "Fittings / Elbows", "Elbows, Reducers, Wear-Back Plates", "Erosion at direction changes carrying abrasive slurry, wear-back condition", "FLW - Flow-Induced Damage"],
  ["Process Equipment (Mechanical)", "Piping Systems (Process / Chemical / Slurry-Sludge Lines)", "Joints / Connections", "Flanges, Victaulic/Mechanical Couplings", "Leakage, bolt and gasket condition", "CFI - Connection & Joint Failures; LOC - Leakage / Loss of Containment"],
  ["Process Equipment (Mechanical)", "Piping Systems (Process / Chemical / Slurry-Sludge Lines)", "Supports / Hangers", "Pipe Shoes, Hangers, Guides", "Overload, corrosion at contact points, misalignment", "DFI - Deformation & Mechanical Damage; CML - Corrosion & Material Loss"],
  ["Process Equipment (Mechanical)", "Storage Tank (Treated Water / Effluent)", "Shell", "Shell Courses", "Wall thinning, coating condition", "CML - Corrosion & Material Loss"],
  ["Process Equipment (Mechanical)", "Storage Tank (Treated Water / Effluent)", "Roof", "Roof Structure, Roof Seals", "Deformation, water ingress at seals", "DFI - Deformation & Mechanical Damage; EWF - Envelope Failure"],
  ["Process Equipment (Mechanical)", "Storage Tank (Treated Water / Effluent)", "Bottom / Foundation Interface", "Bottom Plate, Annular Ring, Ring-wall", "Underside corrosion, settlement at ring-wall interface", "CML - Corrosion & Material Loss; FDS - Foundation & Settlement"],
  ["Process Equipment (Mechanical)", "Storage Tank (Treated Water / Effluent)", "Nozzles", "Inlet/Outlet, Overflow", "Leakage, cracking at connections", "CFI - Connection & Joint Failures; CML - Corrosion & Material Loss"],
  ["Process Equipment (Mechanical)", "Effluent Discharge Structure / Outfall", "Discharge Structure", "Headwall, Discharge Pipe", "Erosion, structural cracking, scour at point of discharge", "FLW - Flow-Induced Damage; CND - Concrete Deterioration"],
  ["Process Equipment (Mechanical)", "Effluent Discharge Structure / Outfall", "Erosion Protection", "Riprap / Energy Dissipator", "Scour, displacement, undermining of receiving channel bank", "SIE - Soil Instability & Erosion; FDS - Foundation & Settlement"],
  ["Structural Support", "Tank / Basin Foundation Interface", "Concrete Ringwall / Basin Wall", "Ringwall, Bearing Pad & Grout", "Settlement/differential settlement, load distribution, concrete integrity", "FDS - Foundation & Settlement; CND - Concrete Deterioration"],
  ["Structural Support", "Tank / Basin Foundation Interface", "Anchor Chairs", "Anchor Chair, Base Plate", "Anchorage corrosion, cracking at anchor chair", "CFI - Connection & Joint Failures; CML - Corrosion & Material Loss"],
  ["Structural Support", "Clarifier / Thickener Support", "Center Column Foundation", "Foundation Pedestal", "Bearing support, settlement beneath rotating drive column", "FDS - Foundation & Settlement"],
  ["Structural Support", "Clarifier / Thickener Support", "Bridge / Walkway Support", "Support Beams, Bracing", "Alignment, corrosion, structural capacity for drive bridge and access walkway", "CML - Corrosion & Material Loss; DFI - Deformation & Mechanical Damage"],
  ["Structural Support", "Pump Bases / Skids", "Grouted Steel Base", "Baseplate, Grout", "Grout condition and load transfer under vibrating equipment", "FDS - Foundation & Settlement"],
  ["Structural Support", "Pump Bases / Skids", "Anchorage", "Anchor Bolts", "Anchor bolt corrosion, looseness, failure", "CFI - Connection & Joint Failures"],
  ["Structural Support", "Pump Bases / Skids", "Skid Frame", "Frame Members", "Distortion from vibration or impact", "DFI - Deformation & Mechanical Damage"],
  ["Structural Support", "Silo Support Structure", "Support Legs / Skirt", "Legs, Skirt, Bracing", "Buckling, corrosion, lateral stability under wind/seismic and full-silo loading", "DFI - Deformation & Mechanical Damage; CML - Corrosion & Material Loss"],
  ["Structural Support", "Pipe Supports / Hangers", "Shoe / Saddle", "Pipe Shoe, Saddle", "Corrosion at pipe-to-support contact points", "CML - Corrosion & Material Loss"],
  ["Structural Support", "Pipe Supports / Hangers", "U-Bolts & Clamps", "Fasteners", "Fixation adequacy, loose or missing clamps on vibrating/slurry lines", "CFI - Connection & Joint Failures"],
  ["Structural Support", "Pipe Supports / Hangers", "Guides & Anchors", "Guide Assembly, Anchor Point", "Movement control, seized or broken guides restricting thermal/mechanical movement", "DFI - Deformation & Mechanical Damage"],
  ["Structural Support", "Pipe Racks (process / chemical / slurry lines)", "Transverse Beams", "Beams", "Corrosion, deflection of load-bearing beams", "CML - Corrosion & Material Loss; DFI - Deformation & Mechanical Damage"],
  ["Structural Support", "Pipe Racks (process / chemical / slurry lines)", "Bracing", "Bracing Members", "Lateral stability, loose or disconnected bracing", "CFI - Connection & Joint Failures"],
  ["Structural Support", "Pipe Racks (process / chemical / slurry lines)", "Base Plates", "Base Plate, Grout", "Anchorage, grout loss/settlement at base", "FDS - Foundation & Settlement"],
  ["Structural Support", "Equipment Frames (mixers, agitators, dosing skids)", "Cross Members", "Frame Members", "Distortion under dynamic/vibration loading", "DFI - Deformation & Mechanical Damage"],
  ["Structural Support", "Equipment Frames (mixers, agitators, dosing skids)", "Gusset Plates", "Welded Connections", "Fatigue cracking at gusset welds", "CRK - Cracking Mechanisms"],
  ["Structural Support", "Anchor Bolts / Baseplates (general)", "Grout Bed", "Grout", "Load transfer condition, cracking or missing grout", "FDS - Foundation & Settlement"],
  ["Structural Support", "Anchor Bolts / Baseplates (general)", "Anchor Plate", "Plate, Levelling Nuts", "Corrosion, alignment, seized levelling nuts", "CML - Corrosion & Material Loss"],
  ["Structural Support", "Cable Tray Supports", "Cantilever Arms / Trapeze Hangers", "Support Arms, Hangers", "Corrosion, coating failure, loose or corroded hanger rods", "CML - Corrosion & Material Loss; CFI - Connection & Joint Failures"],
  ["Structural Support", "Structural Steel Supporting Vessels / Tanks", "Saddle Supports", "Saddle", "Distortion or corrosion at saddle support points", "DFI - Deformation & Mechanical Damage; CML - Corrosion & Material Loss"],
  ["Structural Support", "Structural Steel Supporting Vessels / Tanks", "Skirt / Legs", "Skirt, Legs", "Corrosion, cracking at skirt or legs supporting process vessels", "CML - Corrosion & Material Loss; CRK - Cracking Mechanisms"],
  ["Structural Support", "Structural Steel Supporting Vessels / Tanks", "Welded Connections", "Critical Welds", "Cracking at welded connections under sustained/cyclic loading", "CRK - Cracking Mechanisms"],
  ["Foundations & Geotechnical", "Shallow Foundations", "Pad / Spread Footings", "Footing", "Uneven or differential settlement, cracking", "FDS - Foundation & Settlement"],
  ["Foundations & Geotechnical", "Shallow Foundations", "Strip Footings, Grade Beams", "Footing / Beam", "Cracking of foundation elements, load distribution", "CRK - Cracking Mechanisms; FDS - Foundation & Settlement"],
  ["Foundations & Geotechnical", "Slabs-on-Grade", "Reinforced Slab, Subgrade/Sub-base", "Slab, Compacted Fill", "Tilting, loss of soil stiffness / bearing capacity, voids beneath slab", "FDS - Foundation & Settlement; BCF - Bearing Capacity Failure"],
  ["Foundations & Geotechnical", "Slabs-on-Grade", "Control Joints, Vapour Barrier", "Joint, Barrier", "Joint spalling/differential movement, moisture ingress", "CRK - Cracking Mechanisms; SIE - Soil Instability & Erosion"],
  ["Foundations & Geotechnical", "Soil Interaction Zones", "Backfill / Surrounding Soil", "Drainage Paths, Perimeter Zones", "Voids under foundation, washed-out soil, undermining", "SIE - Soil Instability & Erosion"],
  ["Foundations & Geotechnical", "Soil Interaction Zones", "Drainage Layer, Perimeter Grading", "Drain, Grading", "Blocked or eroded drainage, negative grading causing ponding at foundations", "SIE - Soil Instability & Erosion"],
  ["Foundations & Geotechnical", "Legacy Mine Ground Interface", "Backfilled / Reclaimed Ground", "Engineered Fill over Former Workings", "Long-term consolidation settlement of placed fill overlying disturbed mine ground", "FDS - Foundation & Settlement; MSB - Mine Subsidence & Ground Instability"],
  ["Foundations & Geotechnical", "Legacy Mine Ground Interface", "Void / Subsidence Zones", "Shallow Voids, Collapsed Workings", "Subsidence and void migration risk from collapse of underlying abandoned workings; sinkhole potential", "MSB - Mine Subsidence & Ground Instability; BCF - Bearing Capacity Failure"],
  ["Foundations & Geotechnical", "Legacy Mine Ground Interface", "Old Mine Workings Below Grade", "Shafts, Adits, Stopes (if mapped nearby)", "Proximity to unmapped or poorly documented workings; ongoing ground movement monitoring needs", "MSB - Mine Subsidence & Ground Instability"],
  ["Foundations & Geotechnical", "Frost-Sensitive Soils (climate-dependent)", "Shallow Foundations in Frost Zone", "Frost-Susceptible Soil", "Upward movement, cracking and lifting from freeze-thaw cycling", "FH - Frost Heave"],
  ["Foundations & Geotechnical", "Concrete Foundations", "Footings / Pedestals, Pile Caps", "Concrete Element", "Spalling, surface/structural cracking", "CND - Concrete Deterioration"],
  ["Foundations & Geotechnical", "Concrete Foundations", "Reinforcement / Rebar", "Rebar", "Corrosion of reinforcement, especially where acidic/sulfate-bearing mine water can reach foundations", "CND - Concrete Deterioration"],
  ["Foundations & Geotechnical", "Concrete Foundations", "Waterproofing", "Membrane / Coating", "Failed waterproofing, water/chemical ingress to foundation concrete", "SIE - Soil Instability & Erosion; CND - Concrete Deterioration"],
  ["Foundations & Geotechnical", "Bearing / Load Transfer Zones", "Bearing Soils", "Foundation-Soil Interface", "Sudden or differential settlement, local bearing failure under concentrated loads", "BCF - Bearing Capacity Failure"],
  ["Foundations & Geotechnical", "Deep Foundations (where used)", "Pile Foundations", "Pile Shaft, Toe/Bearing Layer", "Inclined or broken piles, insufficient penetration to bearing layer", "PF - Pile Foundations"],
  ["Foundations & Geotechnical", "Deep Foundations (where used)", "Pile-to-Cap Connection", "Connection Detail", "Cracking or separation at pile-to-cap connection", "CFI - Connection & Joint Failures; PF - Pile Foundations"],
  ["Building Envelope", "Roofing Systems", "Membrane / Metal Roof", "Deck, Insulation, Flashing & Parapets", "Water ingress, corrosion of steel deck, sagging/deformation", "EWF - Envelope Failure; CML - Corrosion & Material Loss; DFI - Deformation & Mechanical Damage"],
  ["Building Envelope", "Roofing Systems", "Roof Drainage & Penetrations", "Gutters, Drains, Skylights, Penetration Seals", "Blocked/corroded drains, ponding, failed penetration seals", "GHK - General Housekeeping & Maintenance; EWF - Envelope Failure"],
  ["Building Envelope", "Wall Cladding", "Metal / Insulated Panel", "Panel, Sealants & Joints, Louvres/Vents", "Water ingress, panel delamination, corroded louvres, weather damage", "EWF - Envelope Failure; ENV - Environmental & External Damage; CML - Corrosion & Material Loss"],
  ["Building Envelope", "Concrete Floors / Slabs", "Slab-on-Grade", "Topping/Wearing Surface, Construction/Control Joints", "Cracking, spalling, chemical attack from spills of process chemicals", "CND - Concrete Deterioration; CRK - Cracking Mechanisms"],
  ["Building Envelope", "Structural Columns (building)", "Steel / Concrete Column", "Base Plates & Anchor Bolts, Splices", "Corrosion of exposed steel, anchorage condition, misalignment", "CML - Corrosion & Material Loss; CFI - Connection & Joint Failures; DFI - Deformation & Mechanical Damage"],
  ["Building Envelope", "Beams / Framing", "Steel Framing", "Beam-to-Column Connections, Bracing, Purlins/Girts", "Fatigue or weld cracking, deflection/overstress, corrosion of secondary framing", "CRK - Cracking Mechanisms; DFI - Deformation & Mechanical Damage; CML - Corrosion & Material Loss"],
  ["Building Envelope", "Walkways / Platforms", "Steel Grating / Checker Plate", "Decking, Support Framing, Toe/Kick Plates", "Corrosion, trip hazards, deflection of supporting steel", "CML - Corrosion & Material Loss; GHK - General Housekeeping & Maintenance"],
  ["Building Envelope", "Stairways", "Steel Stairs", "Treads & Risers, Stringers, Landings", "Worn/loose treads, corrosion or cracking of stringers, deflection at landings", "GHK - General Housekeeping & Maintenance; CML - Corrosion & Material Loss"],
  ["Building Envelope", "Access Ladders & Cages", "Fixed Ladder", "Rungs & Rails, Safety Cage, Ladder Anchors", "Corroded/bent/missing rungs, loose cage fixings and anchors", "CML - Corrosion & Material Loss; CFI - Connection & Joint Failures"],
  ["Building Envelope", "Handrails / Guardrails", "Steel Rail System", "Top/Mid Rails, Posts & Bases, Fasteners & Welds", "Bent, loose or missing rails, corroded posts, cracked welds", "DFI - Deformation & Mechanical Damage; CFI - Connection & Joint Failures"],
  ["Building Envelope", "Grating Systems", "Floor Grating", "Grating Clips, Support Angles, Edge Banding", "Missing/loose clips, corroded support angles, damaged edge banding", "CFI - Connection & Joint Failures; CML - Corrosion & Material Loss"],
  ["Building Envelope", "General / Envelope-Wide", "All Building Elements", "N/A", "Vehicle/equipment impact damage, environmental degradation, unauthorized modification, fire exposure", "ENV - Environmental & External Damage; MSI - Modification & Structural Integrity; THR - Fire & Thermal Damage"],
];

// ============================================================
// HELPER: Extract deficiency codes from mechanism string
// ============================================================
function extractCodes(mechanismsStr) {
  if (!mechanismsStr || mechanismsStr.trim() === '') return [];
  return mechanismsStr.split(';').map(s => s.trim().split(' - ')[0]).filter(Boolean);
}

function extractFull(mechanismsStr) {
  if (!mechanismsStr || mechanismsStr.trim() === '') return [];
  return mechanismsStr.split(';').map(s => s.trim()).filter(Boolean);
}

// ============================================================
// BUILD NODES
// ============================================================
const nodes = [];
const nodeMap = {};  // key: `${level}::${label}` => node_id

function getOrCreateNode(level, label, category, displayOrder) {
  const key = `${level}::${label}`;
  if (nodeMap[key]) return nodeMap[key];

  const node = {
    node_id: uuidv4(),
    parent_id: null, // set later
    level,
    category,
    label,
    display_order: displayOrder,
    is_active: true,
  };
  nodeMap[key] = node;
  nodes.push(node);
  return node;
}

// Track display_order per level per parent
const orderCounters = {};

function nextOrder(level) {
  if (!orderCounters[level]) orderCounters[level] = 0;
  orderCounters[level]++;
  return orderCounters[level];
}

// Track seen category names for dedup
const seenCategories = {};

for (const row of EXCEL_ROWS) {
  const [catLabel, eqLabel, compLabel, subLabel, focusLabel, mechanismsStr] = row;

  // --- Level 1: Category ---
  const catKey = `category::${catLabel}`;
  if (!seenCategories[catLabel]) {
    seenCategories[catLabel] = true;
    const catNode = {
      node_id: uuidv4(),
      parent_id: null,
      level: 'category',
      category: catLabel,
      label: catLabel,
      display_order: nextOrder('category'),
      is_active: true,
    };
    nodeMap[catKey] = catNode;
    nodes.push(catNode);
  }

  // --- Level 2: Equipment Type ---
  const eqKey = `equipment_type::${eqLabel}`;
  if (!nodeMap[eqKey]) {
    const eqNode = {
      node_id: uuidv4(),
      parent_id: nodeMap[catKey].node_id,
      level: 'equipment_type',
      category: catLabel,
      label: eqLabel,
      display_order: nextOrder('equipment_type'),
      is_active: true,
    };
    nodeMap[eqKey] = eqNode;
    nodes.push(eqNode);
  }

  // --- Level 3: Component ---
  const compKey = `component::${compLabel}`;
  if (!nodeMap[compKey]) {
    const compNode = {
      node_id: uuidv4(),
      parent_id: nodeMap[eqKey].node_id,
      level: 'component',
      category: catLabel,
      label: compLabel,
      display_order: nextOrder('component'),
      is_active: true,
    };
    nodeMap[compKey] = compNode;
    nodes.push(compNode);
  }

  // --- Level 4: Sub-component ---
  const subKey = `sub_component::${subLabel}`;
  if (!nodeMap[subKey]) {
    const subNode = {
      node_id: uuidv4(),
      parent_id: nodeMap[compKey].node_id,
      level: 'sub_component',
      category: catLabel,
      label: subLabel,
      display_order: nextOrder('sub_component'),
      is_active: true,
    };
    nodeMap[subKey] = subNode;
    nodes.push(subNode);
  }

  // --- Level 5: Focus Area ---
  // Normalize focus label (truncate if too long, but keep unique)
  const focusKey = `focus_area::${focusLabel}`;
  if (!nodeMap[focusKey]) {
    const focusNode = {
      node_id: uuidv4(),
      parent_id: nodeMap[subKey].node_id,
      level: 'focus_area',
      category: catLabel,
      label: focusLabel,
      display_order: nextOrder('focus_area'),
      is_active: true,
      // Deficiency mechanisms are TAGS on the focus_area, not separate nodes
      deficiency_mechanisms: extractFull(mechanismsStr),
      deficiency_codes: extractCodes(mechanismsStr),
    };
    nodeMap[focusKey] = focusNode;
    nodes.push(focusNode);
  }
}

// ============================================================
// DEFICIENCY CATEGORY REFERENCE (from Sheet 2)
// ============================================================
const deficiencyCategoryReference = [
  {
    code: "CML",
    deficiency_category: "Corrosion & Material Loss",
    definition: "General or localized wall thinning from corrosion, pitting, crevice attack, microbiologically influenced corrosion (MIC), or corrosion under insulation.",
    relevance: "Accelerated by low pH, high sulfate/chloride content, and dissolved metals typical of acid mine drainage (AMD); prevalent on wetted steel in clarifiers, reactors, and piping."
  },
  {
    code: "CRK",
    deficiency_category: "Cracking Mechanisms",
    definition: "Fatigue cracking, stress corrosion cracking, weld/HAZ cracking, thermal fatigue.",
    relevance: "Relevant at agitator shafts, rake arm welds, and dosing skid frames subject to cyclic/vibration loading."
  },
  {
    code: "DFI",
    deficiency_category: "Deformation & Mechanical Damage",
    definition: "Bulging, buckling, dents, distortion, misalignment, impact damage.",
    relevance: "Common on silo shells, rake arms, and pipe supports exposed to abrasive slurry or mobile-equipment impact."
  },
  {
    code: "CFI",
    deficiency_category: "Connection & Joint Failures",
    definition: "Bolted, welded, or flanged connection failures; anchor bolt failure; gasket/seal degradation.",
    relevance: "Frequent at flanged chemical piping joints and anchor bolts exposed to corrosive spillage or washdown."
  },
  {
    code: "FDS",
    deficiency_category: "Foundation & Settlement",
    definition: "Differential settlement, grout deterioration, drainage-related undermining of foundations.",
    relevance: "Elevated risk where structures bear on fill placed over disturbed or reclaimed mine ground."
  },
  {
    code: "CND",
    deficiency_category: "Concrete Deterioration",
    definition: "Cracking, spalling, scaling, sulfate attack, reinforcement corrosion, freeze-thaw damage.",
    relevance: "Sulfate attack and reinforcement corrosion risk are elevated by contact with acidic, sulfate-rich mine water in tanks, basins, and foundations."
  },
  {
    code: "ENV",
    deficiency_category: "Environmental & External Damage",
    definition: "Wind, snow/ice, UV degradation, external impact, corrosive atmosphere.",
    relevance: "Open basins and reactors create a humid, corrosive atmosphere around structural steel and coatings."
  },
  {
    code: "GHK",
    deficiency_category: "General Housekeeping & Maintenance",
    definition: "Missing components, poor maintenance, debris accumulation, trip hazards.",
    relevance: "Applies broadly to walkways, platforms, and access structures across the site."
  },
  {
    code: "MSI",
    deficiency_category: "Modification & Structural Integrity",
    definition: "Unauthorized modification, addition of load without design review.",
    relevance: "Watch for field-added platforms, piping, or equipment not reflected in original design basis."
  },
  {
    code: "THR",
    deficiency_category: "Fire & Thermal Damage",
    definition: "Fire exposure, thermal cycling, thermal shock.",
    relevance: "Includes exothermic heat generated during lime slaking, and any electrical/fire risk areas."
  },
  {
    code: "EWF",
    deficiency_category: "Envelope Failure",
    definition: "Water ingress, roof/wall seal or membrane failure, loss of weatherproofing.",
    relevance: "Relevant to chemical storage buildings and roofed control/electrical buildings."
  },
  {
    code: "SIE",
    deficiency_category: "Soil Instability & Erosion",
    definition: "Soil erosion, washed-out backfill, voids from poor drainage or water infiltration.",
    relevance: "Heightened around basins/ponds and discharge structures with continuous water contact."
  },
  {
    code: "FH",
    deficiency_category: "Frost Heave",
    definition: "Ground movement (upward heave, cracking) from freeze-thaw cycling in frost-susceptible soils.",
    relevance: "Climate-dependent; relevant for shallow foundations in cold-climate sites."
  },
  {
    code: "BCF",
    deficiency_category: "Bearing Capacity Failure",
    definition: "Sudden or local settlement/collapse from inadequate soil bearing capacity.",
    relevance: "Higher risk over loosely placed mine backfill or areas with undocumented ground disturbance."
  },
  {
    code: "PF",
    deficiency_category: "Pile Foundations",
    definition: "Pile misalignment, breakage, or structural defects in deep foundation elements.",
    relevance: "Applies where piles were used to bridge poor or disturbed mine-site ground."
  },
  {
    code: "LOC",
    deficiency_category: "Leakage / Loss of Containment",
    definition: "Seal, gasket, or pressure-boundary leakage.",
    relevance: "Priority item for chemical containment and any pressurized process/membrane equipment."
  },
  {
    code: "OPR",
    deficiency_category: "Operational & Process-Related Damage",
    definition: "Fouling, scaling, blockages, or damage from operating outside design conditions.",
    relevance: "Scaling from iron/manganese/gypsum precipitation is common in mine-water treatment process equipment."
  },
  {
    code: "FLW",
    deficiency_category: "Flow-Induced Damage",
    definition: "Erosion, abrasion, and cavitation from high-velocity or particulate-laden flow.",
    relevance: "A leading damage mechanism here given abrasive lime slurry, HDS recycle, and thickened sludge streams."
  },
  {
    code: "MSB",
    deficiency_category: "Mine Subsidence & Ground Instability",
    definition: "Void migration, subsidence, or sinkhole formation from collapse of underlying abandoned mine workings.",
    relevance: "Site-specific risk category added for this closed mine site; warrants geotechnical desktop review of historic workings beneath structures."
  }
];

// ============================================================
// HIERARCHY LEVEL DEFINITION
// ============================================================
const hierarchyLevels = [
  {
    level_key: "category",
    display_name: "Asset Category",
    expected_parent_level: null
  },
  {
    level_key: "equipment_type",
    display_name: "Equipment Type",
    expected_parent_level: "category"
  },
  {
    level_key: "component",
    display_name: "Component",
    expected_parent_level: "equipment_type"
  },
  {
    level_key: "sub_component",
    display_name: "Subcomponent",
    expected_parent_level: "component"
  },
  {
    level_key: "focus_area",
    display_name: "Focus Area for Structural Integrity Assessment",
    expected_parent_level: "sub_component"
  }
];

// ============================================================
// OUTPUT
// ============================================================
const outPath = path.join(__dirname, 'proper-taxonomy.json');
fs.writeFileSync(outPath, JSON.stringify({
  meta: {
    source: "WTP_Structural_Integrity_Asset_Library_V1.xlsx",
    total_nodes: nodes.length,
    hierarchy_level_count: 5,
    hierarchy_levels: hierarchyLevels.map(h => h.level_key),
    note: "Deficiency mechanisms are tags on focus_area nodes, NOT separate hierarchy levels",
  },
  hierarchy_levels: hierarchyLevels,
  deficiency_category_reference: deficiencyCategoryReference,
  nodes: nodes,
}, null, 2), 'utf-8');
console.log('Wrote ' + nodes.length + ' nodes to ' + outPath);